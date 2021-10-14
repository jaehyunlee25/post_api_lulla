import {
  RESPOND,
  ERROR,
  getUserIdFromToken,
  POST,
} from '../../../lib/apiCommon';
import setBaseURL from '../../../lib/pgConn'; // include String.prototype.fQuery

const QTS = {
  // Query TemplateS
  getComment: 'getCommentById',
  newComment: 'newComment',
  toComment: 'newToComment',
};

// req.body를 만들지 않도록 한다.
// export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  // #1. cors 해제
  res.writeHead(200, {
    'Access-Control-Allow-Origin': '*', // for same origin policy
    'Content-Type': 'application/json',
    'Access-Control-Allow-Headers': ['Content-Type', 'Authorization'], // for application/json
    'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
  });
  // #2. preflight 처리
  if (req.method === 'OPTIONS') return RESPOND(res, {});

  setBaseURL('sqls/comment/comment'); // 끝에 슬래시 붙이지 마시오.

  // #3.1.
  try {
    if (req.method === 'POST') return await post(req, res);
    return await get(req, res);
  } catch (e) {
    return ERROR(res, {
      id: 'ERR.post.index.3.2.2',
      message: 'post server logic error',
      error: e.toString(),
    });
  }
}
async function get(req, res) {
  // #3.1. 사용자 토큰을 이용해 userId를 추출한다.
  // 이 getUserIdFromToken 함수는 user의 활성화 여부까지 판단한다.
  // userId가 정상적으로 리턴되면, 활성화된 사용자이다.
  const qUserId = await getUserIdFromToken(req.headers.authorization);
  if (qUserId.type === 'error') return qUserId.onError(res, '3.1');
  const userId = qUserId.message;

  const { member_id: memberId, comment } = req.query;
  const {
    content,
    comment_id: commentId,
    target_member_id: targetMemberId,
  } = comment;

  // #3.2. member 검색
  const qMember = await POST(
    'school',
    '/checkMember',
    { 'Content-Type': 'application/json' },
    { userId, memberId },
  );
  if (qMember.type === 'error')
    return qMember.onError(res, '3.2', 'fatal error while searching member');
  const { schoolId /* , grade, classId, kidId */ } = qMember.message;

  console.log(content, commentId, targetMemberId, schoolId);
}
async function post(req, res) {
  // #3.1. 사용자 토큰을 이용해 userId를 추출한다.
  // 이 getUserIdFromToken 함수는 user의 활성화 여부까지 판단한다.
  // userId가 정상적으로 리턴되면, 활성화된 사용자이다.
  const qUserId = await getUserIdFromToken(req.headers.authorization);
  if (qUserId.type === 'error') return qUserId.onError(res, '3.1');
  const userId = qUserId.message;

  const { member_id: memberId, comment } = req.query;
  const {
    content,
    comment_id: commentId,
    target_member_id: targetMemberId,
  } = comment;

  // #3.2. member 검색
  const qMember = await POST(
    'school',
    '/checkMember',
    { 'Content-Type': 'application/json' },
    { userId, memberId },
  );
  if (qMember.type === 'error')
    return qMember.onError(res, '3.2', 'fatal error while searching member');
  const { schoolId /* , grade, classId, kidId */ } = qMember.message;

  // #3.3. comment 검색
  const qComment = await QTS.getComment.fQuery({ commentId });
  if (qComment.type === 'error')
    return qComment.onError(res, '3.2', 'fatal error while searching member');
  if (qComment.message.rows.length === 0)
    return ERROR(res, {
      resultCode: 400,
      message: '해당하는 대댓글을 생성할 댓글을 찾을 수 없습니다.',
    });

  // #3.4. 대댓글 생성
  const qNew = await QTS.newComment.fQuery({
    content,
    memberId,
    targetMemberId,
  });
  if (qNew.type === 'error')
    return qNew.onError(res, '3.2', 'creating comment');
  const toCommentId = qNew.message.rows[0].id;

  // #3.5. 대댓글 연결
  const qTo = await QTS.newComment.fQuery({
    commentId,
    toCommentId,
  });
  if (qTo.type === 'error')
    return qTo.onError(res, '3.2', 'creating tocomment');

  // #3.6. 대댓글 소환
  const qToCom = await QTS.getComment.fQuery({ toCommentId });
  if (qToCom.type === 'error')
    return qToCom.onError(res, '3.2', 'searching tocomment');
  // const comment = qToCom.message.rows[0];

  return RESPOND(res, {
    comment,
    message: '성공적으로 대댓글을 생성하였습니다.',
    resultCode: 200,
  });
}
