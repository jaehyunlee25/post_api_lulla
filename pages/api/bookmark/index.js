import {
  RESPOND,
  ERROR,
  getUserIdFromToken,
  POST,
} from '../../../lib/apiCommon';
import '../../../lib/pgConn'; // include String.prototype.fQuery

const QTS = {
  // Query TemplateS
  getAllBM: 'getAllBookmarks',
  getBMtype: 'getBookmarksByType',
};
const baseUrl = 'sqls/bookmark/bookmark'; // 끝에 슬래시 붙이지 마시오.
// req.body를 만들지 않도록 한다.
// export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  // #1. cors 해제
  res.writeHead(200, {
    'Access-Control-Allow-Origin': '*', // for same origin policy
    'Content-Type': 'application/json',
    'Access-Control-Allow-Headers': ['Content-Type', 'Authorization'], // for application/json
    'Access-Control-Allow-Methods': 'GET',
  });
  // #2. preflight 처리
  if (req.method === 'OPTIONS') return RESPOND(res, {});

  // #3.1.
  try {
    return await main(req, res);
  } catch (e) {
    return ERROR(res, {
      id: 'ERR.bookmark.bookmark.3.2.2',
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

  const { member_id: memberId, type } = req.query;

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

  // #3.3. bookmark 검색
  // eslint-disable-next-line eqeqeq
  const query = type == 0 ? QTS.getAllBM : QTS.getBMtype;
  const qBM = await query.fQuery(baseUrl, { memberId, type });
  if (qBM.type === 'error')
    return qBM.onError(res, '3.3', 'searching bookmarks');

  const bookmark = qBM.message.rows;

  return RESPOND(res, {
    bookmark,
    message: '북마크 리스트를 반환하였습니다.',
    resultCode: 200,
  });
}
