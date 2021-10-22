import {
  RESPOND,
  ERROR,
  getUserIdFromToken,
  POST,
} from '../../../lib/apiCommon';
import setBaseURL from '../../../lib/pgConn'; // include String.prototype.fQuery

const QTS = {
  // Query TemplateS
  getFile: 'getFileById',
};

// req.body를 만들지 않도록 한다.
// export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  // #1. cors 해제
  res.writeHead(200, {
    'Access-Control-Allow-Origin': '*', // for same origin policy
    'Content-Type': 'application/json',
    'Access-Control-Allow-Headers': ['Content-Type', 'Authorization'], // for application/json
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  });
  // #2. preflight 처리
  if (req.method === 'OPTIONS') return RESPOND(res, {});

  setBaseURL('sqls/bookmark/image'); // 끝에 슬래시 붙이지 마시오.

  // #3.1.
  try {
    return await main(req, res);
  } catch (e) {
    return ERROR(res, {
      id: 'ERR.bookmark.image.3.2.2',
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

  const { member_id: memberId, userBookmark } = req.body;
  const { image_id: imageId } = userBookmark;

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

  // #3.3. school 유효성 판단
  if (!schoolId)
    return ERROR(res, {
      resultCode: 401,
      id: '3.3',
      message: '원 가입 후 진행해주세요.',
    });

  // #3.4. image 검색
  const qFile = await QTS.getFile.fQuery({ imageId });
  if (qFile.type === 'error')
    return qFile.onError(res, '3.4', 'searching post');

  // #3.5. image 존재여부
  if (qFile.message.rows.length === 0)
    return ERROR(res, {
      resultCode: 203,
      id: '3.5',
      message: '북마크를 할 공지가 존재하지 않습니다.',
    });

  // #3.6. bookmark 검색
  const qBM = await QTS.getBM.fQuery({ memberId, imageId });
  if (qBM.type === 'error')
    return qBM.onError(res, '3.4', 'searching bookmark');

  if (qBM.message.rows.length === 0) {
    // #3.7. bookmark 생성
    const qNew = await QTS.newBM.fQuery({ memberId, imageId });
    if (qNew.type === 'error')
      return qNew.onError(res, '3.4', 'creating bookmark');

    return RESPOND(res, {
      message: '북마크를 생성하였습니다.',
      resultCode: 200,
    });
  }

  // #3.8. bookmark 삭제
  const bookmarkId = qBM.message.rows[0].id;
  const qDel = await QTS.delBM.fQuery({ bookmarkId });
  if (qDel.type === 'error')
    return qDel.onError(res, '3.8', 'removing bookmark');

  return RESPOND(res, {
    message: '북마크를 취소하였습니다.',
    resultCode: 200,
  });
}
