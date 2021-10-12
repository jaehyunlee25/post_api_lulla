import {
  RESPOND,
  ERROR,
  getUserIdFromToken,
  POST,
} from '../../../lib/apiCommon';
import setBaseURL from '../../../lib/pgConn'; // include String.prototype.fQuery

const QTS = {
  // Query TemplateS
  getCountAllowed: 'getAllowedCounts',
  getDefinedAllowed: 'getDefinedAllowed',
  getUndefinedAllowed: 'getUndefinedAllowed',
};

// req.body를 만들지 않도록 한다.
// export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  // #1. cors 해제
  res.writeHead(200, {
    'Access-Control-Allow-Origin': '*', // for same origin policy
    'Content-Type': 'application/json',
    'Access-Control-Allow-Headers': ['Content-Type', 'Authorization'], // for application/json
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  });
  // #2. preflight 처리
  if (req.method === 'OPTIONS') return RESPOND(res, {});

  setBaseURL('sqls/post/member'); // 끝에 슬래시 붙이지 마시오.

  // #3.1.
  try {
    return await main(req, res);
  } catch (e) {
    return ERROR(res, {
      id: 'ERR.post.index.3.2.2',
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

  const { member_id: memberId, id: postId } = req.query;

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

  // #3.3. 공지에 접근 허가된 멤버와 반의 개수 구하기
  const qCount = await QTS.getCountAllowed.fQuery({ postId });
  if (qCount.type === 'error') qCount.onError(res, '3.3', 'getting counts');
  const { ac_count: cntAC } = qCount.message.rows[0].ac_count;
  const { ac_count: cntAM } = qCount.message.rows[0].am_count;

  // #3.4. 결과를 위한 쿼리 선택
  let query;
  if (cntAC === 0 && cntAM === 0) query = QTS.getUndefinedAllowed;
  else query = QTS.getDefinedAllowed;

  // #3.4. 결과 구하기
  const qRes = await query.fQuery({ postId, schoolId });
  if (qRes.type === 'error') qRes.onError(res, '3.4', 'getting members');

  const data = qRes.message.rows[0];

  return RESPOND(res, {
    data,
    message: '정상적으로 공지에 관한 멤버 반환 반환',
    resultCode: 200,
  });
}
