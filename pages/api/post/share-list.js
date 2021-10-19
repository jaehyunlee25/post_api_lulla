import {
  RESPOND,
  ERROR,
  getUserIdFromToken,
  POST,
} from '../../../lib/apiCommon';
import setBaseURL from '../../../lib/pgConn'; // include String.prototype.fQuery

const QTS = {
  // Query TemplateS
  getList: 'getShareList',
};

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
  // if (req.method === 'OPTIONS') return RESPOND(res, {});

  setBaseURL('sqls/post/share-list'); // 끝에 슬래시 붙이지 마시오.

  // #3.1.
  try {
    return await main(req, res);
  } catch (e) {
    return ERROR(res, {
      id: 'ERR.post.like.3.1.1',
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

  const { id: postId, member_id: memberId } = req.query;

  if (!postId)
    return ERROR(res, {
      id: '3.1.1',
      resultCode: 400,
      message: 'id를 설정해주세요',
    });

  if (!memberId)
    return ERROR(res, {
      id: '3.1.1',
      resultCode: 400,
      message: 'member_id를 설정해주세요',
    });

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

  // #3.2. list 검색
  const qAll = await QTS.getList.fQuery({ memberId, postId, schoolId });
  if (qAll.type === 'error') return qAll.onError(res, '3.2.1', 'getting list');
  const data = qAll.message.rows;

  return RESPOND(res, {
    data,
    message: '공유가능한 멤버리스트를 반환했습니다.',
    resultCode: 200,
  });
}
