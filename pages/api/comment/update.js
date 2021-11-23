import {
  RESPOND,
  ERROR,
  getUserIdFromToken,
  POST,
} from '../../../lib/apiCommon';
import '../../../lib/pgConn'; // include String.prototype.fQuery

const QTS = {
  // Query TemplateS
  getComment: 'getCommentById',
  setComment: 'setComment',
};
const baseUrl = 'sqls/comment/update'; // 끝에 슬래시 붙이지 마시오.
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

  // #3.1.
  try {
    return await main(req, res);
  } catch (e) {
    return ERROR(res, {
      id: 'ERR.comment.update.3.2.2',
      message: 'post server logic error',
      error: e.toString(),
    });
  }
}
async function main(req, res) {
  // #3.1. 사용자 토큰을 이용해 userId를 추출한다.
  // 이 getUserIdFromToken 함수는 user의 활성화 여부까지 판단한다.
  // userId가 정상적으로 리턴되면, 활성화된 사용자이다.
  const qUserId = await getUserIdFromToken(req.headers.authorization);
  if (qUserId.type === 'error') return qUserId.onError(res, '3.1');
  const userId = qUserId.message;

  const { member_id: memberId, comment } = req.body;
  const { content, id: commentId } = comment;

  // #3.2. member 검색
  const qMember = await POST(
    'school',
    '/checkMember',
    { 'Content-Type': 'application/json' },
    { userId, memberId },
  );
  if (qMember.type === 'error')
    return qMember.onError(res, '3.2', 'fatal error while searching member');
  // const { schoolId /* , grade, classId, kidId */ } = qMember.message;

  // #3.3. comment 검색
  const qComment = await QTS.getComment.fQuery(baseUrl, { commentId });
  if (qComment.type === 'error')
    return qComment.onError(res, '3.3', 'searching comment');
  if (qComment.message.rows.length === 0)
    return ERROR(res, {
      resultCode: 400,
      message: '수정할 댓글을 찾을 수 없습니다.',
    });
  if (qComment.message.rows[0].member_id !== memberId) {
    return ERROR(res, {
      resultCode: 401,
      message: '해당 댓글을 수정할 권한을 가지고 있지 않습니다.',
    });
  }

  // #3.4. comment 수정
  const qSet = await QTS.setComment.fQuery(baseUrl, { content, commentId });
  if (qSet.type === 'error')
    return qSet.onError(res, '3.4', 'updating comment');

  // #3.5. 댓글 소환
  const qCom = await QTS.getComment.fQuery(baseUrl, { commentId });
  if (qCom.type === 'error')
    return qCom.onError(res, '3.6', 'searching tocomment');
  const userComment = qCom.message.rows[0];

  return RESPOND(res, {
    comment: userComment,
    message: '성공적으로 대댓글을 수정하였습니다.',
    resultCode: 200,
  });
}
