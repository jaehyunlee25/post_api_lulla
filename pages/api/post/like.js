import {
  RESPOND,
  ERROR,
  getUserIdFromToken,
  POST,
} from '../../../lib/apiCommon';
import '../../../lib/pgConn'; // include String.prototype.fQuery

const QTS = {
  // Query TemplateS
  getPost: 'getPostById',
  newLike: 'newLike',
  delLike: 'delLike',
  getLike: 'getLike',
  getAllLikes: 'getAllLikes',
};
const baseUrl = 'sqls/post/like'; // 끝에 슬래시 붙이지 마시오.
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
    if (req.method === 'POST') return await post(req, res);
    if (req.method === 'GET') return await get(req, res);
  } catch (e) {
    return ERROR(res, {
      id: 'ERR.post.like.3.1.1',
      message: 'post server logic error',
      error: e.toString(),
    });
  }
  return false;
}
async function get(req, res) {
  // #3.1. 사용자 토큰을 이용해 userId를 추출한다.
  // 이 getUserIdFromToken 함수는 user의 활성화 여부까지 판단한다.
  // userId가 정상적으로 리턴되면, 활성화된 사용자이다.
  const qUserId = await getUserIdFromToken(req.headers.authorization);
  if (qUserId.type === 'error') return qUserId.onError(res, '3.1');
  const userId = qUserId.message;

  const { member_id: memberId, id: postId } = req.query;

  // #3.2. member 검색
  const qMember = await POST(
    'school',
    '/checkMember',
    { 'Content-Type': 'application/json' },
    { userId, memberId },
  );
  if (qMember.type === 'error')
    return qMember.onError(res, '3.2.1', 'fatal error while searching member');
  const { schoolId /* , grade, classId  , kidId */ } = qMember.message;
  if (!schoolId)
    return ERROR(res, {
      resultCode: '401',
      id: '3.2.2',
      message: '원에 가입 후 진행해주세요.',
    });

  const qAll = await QTS.getAllLikes.fQuery(baseUrl, { memberId, postId });
  if (qAll.type === 'error')
    return qAll.onError(res, '3.4.1', 'getting all likes');
  const like = qAll.message.rows;
  return RESPOND(res, {
    datas: like,
    message: '해당하는 포스트에 좋아요를 성공적으로 반환하였습니다.',
    resultCode: 200,
  });
}
async function post(req, res) {
  // #3.1. 사용자 토큰을 이용해 userId를 추출한다.
  // 이 getUserIdFromToken 함수는 user의 활성화 여부까지 판단한다.
  // userId가 정상적으로 리턴되면, 활성화된 사용자이다.
  const qUserId = await getUserIdFromToken(req.headers.authorization);
  if (qUserId.type === 'error') return qUserId.onError(res, '3.1');
  const userId = qUserId.message;

  const { member_id: memberId, like } = req.body;
  const { post_id: postId } = like;

  // #3.2. member 검색
  const qMember = await POST(
    'school',
    '/checkMember',
    { 'Content-Type': 'application/json' },
    { userId, memberId },
  );
  if (qMember.type === 'error')
    return qMember.onError(res, '3.2.1', 'fatal error while searching member');
  const { schoolId /* , grade, classId  , kidId */ } = qMember.message;
  if (!schoolId)
    return ERROR(res, {
      resultCode: '401',
      id: '3.2.2',
      message: '원에 가입 후 진행해주세요.',
    });

  // #3.3. post 검색
  const qPost = await QTS.getPost.fQuery(baseUrl, { postId });
  if (qPost.type === 'error') return qPost.onError(res, '3.3', 'getting post');
  if (qPost.message.rows.length === 0)
    return ERROR(res, {
      resultCode: '401',
      id: '3.3.1',
      message: '해당 공지가 존재하지 않습니다.',
    });

  // #3.4. like 찾기
  const qLike = await QTS.getLike.fQuery(baseUrl, { memberId, postId });
  if (qLike.type === 'error')
    return qLike.onError(res, '3.4.1', 'getting like');

  // #3.5. new like 생성
  if (qLike.message.rows.length === 0) {
    const qNewLike = await QTS.newLike.fQuery(baseUrl, { memberId, postId });
    if (qNewLike.type === 'error')
      return qNewLike.onError(res, '3.5.1', 'insert like');
    return RESPOND(res, {
      message: '좋아요를 생성하였습니다.',
      resultCode: 200,
    });
  }

  // #3.6. like 삭제
  const qDelLike = await QTS.delLike.fQuery(baseUrl, { memberId, postId });
  if (qDelLike.type === 'error')
    return qDelLike.onError(res, '3.6.1', 'delete like');
  return RESPOND(res, {
    message: '좋아요를 취소하였습니다.',
    resultCode: 200,
  });
}
