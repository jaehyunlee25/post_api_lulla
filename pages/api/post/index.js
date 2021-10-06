import {
  RESPOND,
  ERROR,
  getUserIdFromToken,
  POST,
} from '../../../lib/apiCommon';
import setBaseURL from '../../../lib/pgConn'; // include String.prototype.fQuery

const QTS = {
  // Query TemplateS
  newPost: 'newPost',
  newAMs: 'newAllowedMembers',
  newACs: 'newAllowedClasses',
  getSurvey: 'getSurvey',
  setSurvey: 'setSurvey',
  getPF: 'getPostFile',
  newPF: 'newPostFile',
  setPost: 'setPost',
  setPostDetail: 'setPostDetail',
  delAM: 'delAllowedMember',
  delAC: 'delAllowedClass',
  getPost: 'getPostById',

  getPostCongrat: 'getPostCongratulation',
  getAMcount: 'getAllowedMemberCount',
  getACcount: 'getAllowedClassCount',
  getSVcount: 'getSurveyCount',
  getPDSCOne: 'getPostDetailSurveyCaseOne',
  getPDSCTwo: 'getPostDetailSurveyCaseTwo',
  getPDSCThree: 'getPostDetailSurveyCaseThree',
  getAllComments: 'getAllComments',
  getAllLikes: 'getAllLikes',
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

  setBaseURL('sqls/post/post'); // 끝에 슬래시 붙이지 마시오.

  // #3.1.
  try {
    if (req.method === 'GET') return await get(req, res);
    return await post(req, res);
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

  const {
    member_id: memberId,
    class: classes,
    page,
    id: postId,
    temp,
    category,
    search,
  } = req.query;

  // #3.2. member 검색
  const qMember = await POST(
    'school',
    '/checkMember',
    { 'Content-Type': 'application/json' },
    { userId, memberId },
  );
  if (qMember.type === 'error')
    return qMember.onError(res, '3.2', 'fatal error while searching member');
  const { schoolId, grade, classId /* , kidId */ } = qMember.message;

  // #3.3. 프로필이 없는 경우 축하메시지
  if (!schoolId) {
    const qCon = await QTS.getPostCongrat.fQuery({});
    if (qCon.type === 'error')
      return qCon.onError(res, '3.3', 'searching congrat post');

    const postCongrat = qCon.message.rows[0];
    const congrat = {
      id: postCongrat.id,
      title: postCongrat.title,
      contents: postCongrat.contents,
      is_modified: false,
      published_time: postCongrat.published_time,
      important: postCongrat.important,
      author_id: postCongrat.author_id,
      create_at: postCongrat.create_at,
      like_count: 0,
      comment_count: 0,
      is_like: false,
      is_bookmark: false,
      author_nickname: '랄라',
      allowed_member: [],
      allowed_class: [],
      class_name: null,
      school_name: null,
      author_type: '관리자',
      author_grade: 0,
      author_image:
        'https://s3lulla.s3.ap-northeast-2.amazonaws.com/lulla_1614318630221__8940__.png',
    };
    return RESPOND(res, {
      data: { post: congrat, comment: [], like: [] },
      datas: [congrat],
      total_count: 1,
      total_page: 1,
      message: '성공적으로 데이터를 반환하였습니다.',
      resultCode: 200,
    });
  }

  if (postId) {
    // #3.4. 변수 확보
    const qAM = await QTS.getAMcount.fQuery({ postId });
    if (qAM.type === 'error')
      return qAM.onError(res, '3.4.1', 'counting allowed member');
    const qAC = await QTS.getACcount.fQuery({ postId });
    if (qAC.type === 'error')
      return qAC.onError(res, '3.4.2', 'counting allowed class');
    const qSVC = await QTS.getSVcount.fQuery({ postId });
    if (qSVC.type === 'error')
      return qSVC.onError(res, '3.4.3', 'counting survey');
    const cntAM = qAM.message.rows[0].count;
    const cntAC = qAM.message.rows[0].count;
    const cntSV = qSVC.message.rows[0].count;

    const endDate = await getFormatDate(new Date());
    // #3.5. 공지사항 구하기
    let qts;
    if (cntSV > 0) {
      if (cntAM === 0 && cntAC === 0) qts = QTS.getPDSCTwo;
      else qts = QTS.getPDSCThree;
    } else {
      qts = QTS.getPDSCOne;
    }
    const qPostDetail = await qts.fQuery({
      postId,
      schoolId,
      memberId,
      endDate,
    });
    if (qPostDetail.type === 'error')
      return qPostDetail.onError(res, '3.5.1', 'searching post detail');
    const postDetail = qPostDetail.message.rows[0];
    // #3.6. 댓글 구하기
    const qAllComment = await QTS.getAllComment.fQuery({ postId });
    if (qAllComment.type === 'error')
      return qAllComment.onError(res, '3.6.1', 'searching comments');
    const comment = qAllComment.message.rows;
    // #3.7. 좋아요 구하기
    const qAllLikes = await QTS.getAllLikes.fQuery({ postId });
    if (qAllLikes.type === 'error')
      return qAllLikes.onError(res, '3.6.1', 'searching likes');
    const like = qAllLikes.message.rows;

    return RESPOND(res, {
      data: { post: postDetail, comment, like },
      message: '해당하는 데이터를 성공적으로 반환하였습니다.',
      resultCode: 200,
    });
  }

  return RESPOND(res, {
    userId,
    message: '공지사항 출력 성공',
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

  const { member_id: memberId, post: userPost } = req.body;
  const {
    id,
    title,
    contents,
    important,
    post_type: postType,
    allowed_member: allowedMember,
    survey_id: surveyId,
    file_list: fileList,
    is_published: isPublished, // 푸쉬알림 관련
  } = userPost;
  let { allowed_class: allowedClass } = userPost;
  const mode = id ? 'update' : 'create';

  // #3.2. member 검색
  const qMember = await POST(
    'school',
    '/checkMember',
    { 'Content-Type': 'application/json' },
    { userId, memberId },
  );
  if (qMember.type === 'error')
    return qMember.onError(res, '3.2', 'fatal error while searching member');
  const { schoolId, grade, classId /* , kidId */ } = qMember.message;

  // #3.3. 권한 검사
  if (grade > 3)
    return ERROR(res, {
      type: 'error',
      resultCode: 401,
      message: '해당하는 권한이 존재하지 않습니다.',
    });

  // #3.4. 포스트 저장
  let postId;
  if (mode === 'update') {
    postId = id;
    const qUp = await updatePost(postId, {
      memberId,
      important,
      title,
      contents,
      isPublished,
    });
    if (qUp.type === 'error')
      return ERROR(res, {
        resultCode: '404',
        id: qUp.id,
        type: 'error',
        eStr: qUp.eStr,
        message: qUp.message,
      });
  } else {
    const qPost = await QTS.newPost.fQuery({
      title,
      contents,
      memberId,
      schoolId,
      postType,
      important,
      isPublished: isPublished === undefined ? null : isPublished,
      publishedTime: isPublished === undefined ? null : 'now()',
    });
    if (qPost.type === 'error')
      return qPost.onError(res, '3.4', 'creating post');
    postId = qPost.message.rows[0].id;
  }

  // #3.5. allowed_member 저장
  if (allowedMember) {
    // #3.5.1. 공지 수정작업이면, 기존의 allowed member 정보를 삭제한다.
    if (mode === 'update') {
      const qDelAM = await QTS.delAM.fQuery({ postId });
      if (qDelAM.type === 'error')
        return qDelAM.onError(res, '3.5.1', 'deleting allowed members');
    }
    // #3.5.2. 저장
    const arMemberValues = allowedMember.map((allowedMemberId) => {
      return `(now(), now(), '${allowedMemberId}', '${postId}')`;
    });
    const memberValues = arMemberValues.join(',\r\n');
    const qAM = await QTS.newAMs.fQuery({ memberValues });
    if (qAM.type === 'error')
      return qAM.onError(res, '3.5.2', 'creating allowed members');
  }

  // #3.6. allowed_class 저장
  if (!allowedMember && !allowedClass && classId) allowedClass = [classId];
  if (allowedClass) {
    // #3.6.1. 공지 수정작업이면, 기존의 allowed class 정보를 삭제한다.
    if (mode === 'update') {
      const qDelAC = await QTS.delAC.fQuery({ postId });
      if (qDelAC.type === 'error')
        return qDelAC.onError(res, '3.6.1', 'deleting allowed class');
    }
    // #3.6.2. 저장
    if (classId && !allowedClass.includes(classId)) allowedClass.push(classId);
    const arClassValues = allowedClass.map((allowedClassId) => {
      return `(now(), now(), '${allowedClassId}', '${postId}')`;
    });
    const classValues = arClassValues.join(',\r\n');
    const qAC = await QTS.newACs.fQuery({ classValues });
    if (qAC.type === 'error')
      return qAC.onError(res, '3.6.2', 'creating allowed classes');
  }

  // #3.7. survey 처리
  if (surveyId) {
    const qGS = await QTS.getSurvey.fQuery({ surveyId });
    if (qGS.type === 'error')
      return qGS.onError(res, '3.7.1', 'creating survey');
    if (qGS.message.rows.length === 0)
      return ERROR(res, {
        resultCode: 401,
        message: '해당하는 설문이 없습니다.',
        id: 'ERR.post.index.3.7.2',
      });
    const qUS = await QTS.setSurvey.fQuery({ surveyId, postId });
    if (qUS.type === 'error')
      return qUS.onError(res, '3.7.3', 'updating survey');
  }

  // #3.8. fileList 처리
  if (fileList) {
    fileList.forEach(async (fileId, i) => {
      const qPF = await QTS.getPF.fQuery({ fileId, postId });
      if (qPF.type === 'error')
        return qPF.onError(res, '3.8', 'searching post_file');
      if (qPF.message.rows.length > 0)
        return RESPOND(res, {
          message: '게시물 저장에 성공했습니다.',
          resultCode: 200,
        });

      const qUPF = await QTS.newPF.fQuery({ fileId, postId });
      if (qUPF.type === 'error')
        return qUPF.onError(res, '3.8', 'searching post_file');

      if (i === fileList.length - 1)
        return RESPOND(res, {
          message: '게시물 저장에 성공했습니다.',
          resultCode: 200,
        });
      return true;
    });
  }

  // #3.9. 임시저장 여부 처리
  // 푸쉬알림
  /* if (isPublished) {
    const qSP = await QTS.setPost.fQuery({ postId, isPublished });
    if (qSP.type === 'error') return qSP.onError(res, '3.9.1', 'updating post');

    let pushType;
    if (allowedClass || allowedMember) pushType = 3;
    else if (classId) pushType = 2;
    else pushType = 1;

    const qNick = await QTS.getNick.fQuery({ memberId });
    if (qNick.type === 'error')
      return qNick.onError(res, '3.9.2', 'getting nickname');
    const { nickname } = qNick.message.rows[0];
  } */

  return true;
  /* return RESPOND(res, {
    message: '게시물 저장에 성공했습니다.',
    resultCode: 200,
  }); */
}
async function updatePost(postId, param) {
  const { memberId, important, title, contents, isPublished } = param;
  // #3.4.1. 해당 포스트 찾기
  const qPost = await QTS.getPost.fQuery({ postId });
  if (qPost.type === 'error')
    return {
      id: 'ERR.post.update.3.4.1.',
      message: '해당 공지를 찾는 중에 에러가 발생했습니다.',
      eStr: qPost.eStr,
    };
  // #3.4.1.1.
  if (qPost.message.rows.length === 0)
    return {
      id: 'ERR.post.update.3.4.1.1.',
      message: '해당 공지를 찾는 중에 에러가 발생했습니다.',
      eStr: qPost.eStr,
    };
  // #3.4.1.2.
  const authorId = qPost.message.rows[0].author_id;
  if (authorId !== memberId)
    return {
      id: 'ERR.post.update.3.4.1.2.',
      message: '글 수정은 해당 글을 작성한 사람만 가능합니다.',
      eStr: qPost.eStr,
    };

  // #3.4.2. 포스트 수정
  const isModified = isPublished;
  const qUp = await QTS.setPostDetail.fQuery({
    postId,
    title,
    contents,
    important,
    isPublished: isPublished === undefined ? null : isPublished,
    publishedTime: isPublished === undefined ? null : 'now()',
    isModified,
  });
  if (qUp.type === 'error')
    return {
      id: 'ERR.post.update.3.4.2.1',
      message: '공지를 수정하는 중에 에러가 발생했습니다.',
      eStr: qUp.sStr,
      returnType: 401,
    };

  return true;
}
function getFormatDate(date) {
  const year = date.getFullYear();
  let month = 1 + date.getMonth();
  month = month >= 10 ? month : '0'.add(month);
  let day = date.getDate();
  day = day >= 10 ? day : '0'.add(day);
  return year.add('-').add(month).add('-').add(day);
}
