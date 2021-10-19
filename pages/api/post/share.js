/* eslint-disable no-lonely-if */
import {
  RESPOND,
  ERROR,
  getUserIdFromToken,
  POST,
} from '../../../lib/apiCommon';
import setBaseURL from '../../../lib/pgConn'; // include String.prototype.fQuery

const QTS = {
  // Query TemplateS
  getAM: 'getAllowedMember',
  getAC: 'getAllowedClass',
  getAllMembers: 'getAllMembers',
  getAMs: 'getAllowedMembers',
  getACMs: 'getAllClassMembers',
  getMIMs: 'getMembersInMemberList',
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

  setBaseURL('sqls/post/share'); // 끝에 슬래시 붙이지 마시오.

  // #3.1.
  try {
    return await main(req, res);
  } catch (e) {
    return ERROR(res, {
      id: 'ERR.post.share.3.2.2',
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

  const {
    member_id: memberId,
    id: postId,
    member_list: memberList,
    class_list: classList,
    is_all: isAll,
    // message,
  } = req.body;

  // #3.2. member 검색
  const qMember = await POST(
    'school',
    '/checkMember',
    { 'Content-Type': 'application/json' },
    { userId, memberId },
  );
  if (qMember.type === 'error')
    return qMember.onError(res, '3.2', 'fatal error while searching member');
  const { schoolId /* , classId , grade, kidId */ } = qMember.message;

  let qMems;
  if (isAll) {
    // #3.3. 개수 구하기
    const qAM = await QTS.getAM.fQuery({ postId });
    if (qAM.type === 'error')
      return qAM.onError(res, '3.3.1', 'getting allowed members');
    const qAC = await QTS.getAC.fQuery({ postId });
    if (qAC.type === 'error')
      return qAC.onError(res, '3.3.2', 'getting allowed class');

    const cntAM = qAM.message.rows[0].count;
    const cntAC = qAC.message.rows[0].count;

    // #3.4.
    if (cntAM === 0 && cntAC === 0) {
      qMems = await QTS.getAllMembers.fQuery({ schoolId });
      if (qMems.type === 'error')
        return qMems.onError(res, '3.4.1', 'getting all members');
    } else {
      qMems = await QTS.getAMs.fQuery({ postId });
      if (qMems.type === 'error')
        return qMems.onError(res, '3.4.1', 'getting allowed members');
    }
  } else if (classList) {
    // #3.5.
    const classIds = classList.map((id) => ["'", id, "'"].join('')).join(',');
    qMems = await QTS.getACMs.fQuery({ classIds });
    if (qMems.type === 'error')
      return qMems.onError(res, '3.5.1', 'getting class members');
  } else if (memberList) {
    // #3.6.
    const memberIds = memberList.map((id) => ["'", id, "'"].join('')).join(',');
    qMems = await QTS.getMIMs.fQuery({ memberIds });
    if (qMems.type === 'error')
      return qMems.onError(res, '3.6.1', 'getting members in list');
  }
  const data = qMems.message.rows;

  // 외부에 채팅 메시지 발송(원래는 sendbird)
  // 구현해야 함

  return RESPOND(res, {
    data,
    message: '공지 공유를 하였습니다.',
    resultCode: 200,
  });
}
