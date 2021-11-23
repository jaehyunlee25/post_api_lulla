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
  getIsToCom: 'getToCommentById',
  getHasToCom: 'getHasToCommentById',
  setDelete: 'setDeleteById',
  delComment: 'delCommentById',
  delToComs: 'delCommentsFromToComment',
  delToComment: 'delToCommentById',
  getFromCom: 'getCommentFromToCom',
};
const baseUrl = 'sqls/comment/delete'; // 끝에 슬래시 붙이지 마시오.
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

  // #3.1.
  try {
    return await main(req, res);
  } catch (e) {
    return ERROR(res, {
      id: 'ERR.comment.delete.3.2.2',
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
  const { id: commentId } = comment;

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
      message: '삭제할 댓글을 찾을 수 없습니다.',
    });
  if (qComment.message.rows[0].member_id !== memberId) {
    return ERROR(res, {
      resultCode: 401,
      message: '해당 댓글을 삭제할 권한을 가지고 있지 않습니다.',
    });
  }

  // #3.4. 댓글이 대댓글인지의 여부를 판단한다.
  const qIsToCom = await QTS.getIsToCom.fQuery(baseUrl, { commentId });
  if (qIsToCom.type === 'error')
    return qIsToCom.onError(res, '3.4', 'searching tocomment');
  const isToCom = qIsToCom.message.rows.length === 1;

  // 대댓글이 아닌 경우
  if (!isToCom) {
    // #3.5. 댓글이 대댓글을 가지고 있는지 판단한다.
    const qHasToCom = await QTS.getHasToCom.fQuery(baseUrl, { commentId });
    if (qHasToCom.type === 'error')
      return qHasToCom.onError(res, '3.5', 'searching if it has tocomment');
    const hasToCom = qHasToCom.message.rows.length > 0;
    // #3.6. 대댓글을 가지고 있으면 is_deleted = true;
    if (hasToCom) {
      const qSetDel = await QTS.setDelete.fQuery(baseUrl, { commentId });
      if (qSetDel.type === 'error')
        return qSetDel.onError(res, '3.6', 'set delete comment');
    } else {
      // #3.7. 모든 대댓글 영구삭제
      const qDelComments = await QTS.delToComs.fQuery(baseUrl, { commentId });
      if (qDelComments.type === 'error')
        return qDelComments.onError(res, '3.7', 'delete comments');
      // #3.8. 유효한 대댓글이 없으면 영구삭제;
      const qDel = await QTS.delComment.fQuery(baseUrl, { commentId });
      if (qDel.type === 'error')
        return qDel.onError(res, '3.8', 'delete comment');
      // #3.9. tocomment도 영구삭제
      /* const qDelToCom = await QTS.delToComment.fQuery(baseUrl, { commentId });
      if (qDelToCom.type === 'error')
        return qDelToCom.onError(res, '3.9', 'delete tocomment'); */
    }
  } else {
    console.log('==============', 22);
    // #3.10. 대댓글인 경우 is_deleted = true;
    const qSetDel = await QTS.setDelete.fQuery(baseUrl, { commentId });
    if (qSetDel.type === 'error')
      return qSetDel.onError(res, '3.6', 'set delete comment');
    // #3.11. 대댓글의 원글이 'is_deleted=true'이면 추출
    const qComm = await QTS.getFromCom.fQuery(baseUrl, { commentId });
    if (qComm.type === 'error')
      return qComm.onError(res, '3.11', 'set delete comment');
    console.log('==============', qComm.message.rows.length);
    if (qComm.message.rows.length > 0) {
      const comId = qComm.message.rows[0].id;
      // #3.11.1. 유효한 대댓글이 있는지 확인
      // #3.5. 댓글이 대댓글을 가지고 있는지 판단한다.
      const qHasToCom = await QTS.getHasToCom.fQuery(baseUrl, {
        commentId: comId,
      });
      if (qHasToCom.type === 'error')
        return qHasToCom.onError(res, '3.5', 'searching if it has tocomment');
      const hasToCom = qHasToCom.message.rows.length > 0;
      if (!hasToCom) {
        // #3.12. 모든 대댓글 영구삭제
        const qDelComments = await QTS.delToComs.fQuery(baseUrl, {
          commentId: comId,
        });
        if (qDelComments.type === 'error')
          return qDelComments.onError(res, '3.12', 'delete comments');
        // #3.13. 유효한 대댓글이 없으면 영구삭제;
        const qDel = await QTS.delComment.fQuery(baseUrl, { commentId: comId });
        if (qDel.type === 'error')
          return qDel.onError(res, '3.13', 'delete comment');
        // #3.14. tocomment도 영구삭제
        /* const qDelToCom = await QTS.delToComment.fQuery(baseUrl, { commentId: comId });
        if (qDelToCom.type === 'error')
          return qDelToCom.onError(res, '3.14', 'delete tocomment'); */
      }
    }
  }

  return RESPOND(res, {
    message: '해당하는 데이터를 성공적으로 삭제하였습니다.',
    resultCode: 200,
  });
}
