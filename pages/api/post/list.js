/* eslint-disable no-lonely-if */
import {
  RESPOND,
  ERROR,
  getUserIdFromToken,
  POST,
} from '../../../lib/apiCommon';
import '../../../lib/pgConn'; // include String.prototype.fQuery

const QTS = {
  // Query TemplateS
  getPostCongrat: 'getPostCongratulation',
  getAMcount: 'getAllowedMemberCount',
  getACcount: 'getAllowedClassCount',
  getSVcount: 'getSurveyCount',
  getPDSCOne: 'getPostDetailSurveyCaseOne',
  getPDSCTwo: 'getPostDetailSurveyCaseTwo',
  getPDSCThree: 'getPostDetailSurveyCaseThree',
  getAllComments: 'getAllComments',
  getAllLikes: 'getAllLikes',
  // grade one
  getOne: 'getOne',
  getOneTotal: 'getOneTotal',
  // grade one search
  getOneSearchNone: 'getOneSearchNone',
  getOneTotalSearchNone: 'getOneTotalSearchNone',

  getOneSearchContents: 'getOneSearchContents',
  getOneTotalSearchContents: 'getOneTotalSearchContents',

  getOneSearchAuthor: 'getOneSearchAuthor',
  getOneTotalSearchAuthor: 'getOneTotalSearchAuthor',

  getOneSearchBoth: 'getOneSearchBoth',
  getOneTotalSearchBoth: 'getOneTotalSearchBoth',
  // grade one temp
  getOneTemp: 'getOneTemp',
  getOneTotalTemp: 'getOneTotalTemp',
  // grade one else
  getOneElse: 'getOneElse',
  getOneTotalElse: 'getOneTotalElse',

  // grade two search
  getTwoSearchNone: 'getTwoSearchNone',
  getTwoTotalSearchNone: 'getTwoTotalSearchNone',

  getTwoSearchContents: 'getTwoSearchContents',
  getTwoTotalSearchContents: 'getTwoTotalSearchContents',

  getTwoSearchAuthor: 'getTwoSearchAuthor',
  getTwoTotalSearchAuthor: 'getTwoTotalSearchAuthor',

  getTwoSearchBoth: 'getTwoSearchBoth',
  getTwoTotalSearchBoth: 'getTwoTotalSearchBoth',
  // grade two temp
  getTwoTemp: 'getTwoTemp',
  getTwoTotalTemp: 'getTwoTotalTemp',
  // grade two else
  getTwoElse: 'getTwoElse',
  getTwoTotalElse: 'getTwoTotalElse',

  // grade else search
  getElseSearchNone: 'getElseSearchNone',
  getElseTotalSearchNone: 'getElseTotalSearchNone',

  getElseSearchContents: 'getElseSearchContents',
  getElseTotalSearchContents: 'getElseTotalSearchContents',

  getElseSearchAuthor: 'getElseSearchAuthor',
  getElseTotalSearchAuthor: 'getElseTotalSearchAuthor',

  getElseSearchBoth: 'getElseSearchBoth',
  getElseTotalSearchBoth: 'getElseTotalSearchBoth',
  // grade else else
  getElseElse: 'getElseElse',
  getElseTotalElse: 'getElseTotalElse',
  //
  getPostGrade: 'getPostGrade',
  getCountClass: 'getCountClass',
};
let EXEC_STEP = 0;
const baseUrl = 'sqls/post/list'; // ?????? ????????? ????????? ?????????.

// req.body??? ????????? ????????? ??????.
// export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  // #1. cors ??????
  res.writeHead(200, {
    'Access-Control-Allow-Origin': '*', // for same origin policy
    'Content-Type': 'application/json',
    'Access-Control-Allow-Headers': ['Content-Type', 'Authorization'], // for application/json
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  });
  // #2. preflight ??????
  if (req.method === 'OPTIONS') return RESPOND(res, {});

  // #3.1.
  try {
    return await main(req, res);
  } catch (e) {
    return ERROR(res, {
      id: 'ERR.post.list.3.2.1',
      message: 'post server logic error',
      error: e.toString(),
      step: EXEC_STEP,
    });
  }
}
async function main(req, res) {
  if (req.body.id) return detail(req, res);
  // #3.1. ????????? ????????? ????????? userId??? ????????????.
  // ??? getUserIdFromToken ????????? user??? ????????? ???????????? ????????????.
  // userId??? ??????????????? ????????????, ???????????? ???????????????.
  EXEC_STEP = '3.0';
  const qUserId = await getUserIdFromToken(req.headers.authorization);
  if (qUserId.type === 'error') return qUserId.onError(res, '3.1');
  const userId = qUserId.message;

  EXEC_STEP = '3.1';
  const {
    member_id: memberId,
    class: classes,
    page: userPage,
    id: postId,
    temp,
    category,
    search,
  } = req.body;

  const pageSize = 30;
  const page = pageSize * ((userPage === undefined ? 1 : userPage) - 1);
  const endDate = await getFormatDate(new Date());
  const isPublished = !temp;
  const strClasses = ["'", classes.join("','"), "'"].join('');

  EXEC_STEP = '3.2'; // #3.2. member ??????
  const qMember = await POST(
    'school',
    '/checkMember',
    { 'Content-Type': 'application/json' },
    { userId, memberId },
  );
  if (qMember.type === 'error')
    return qMember.onError(
      res,
      EXEC_STEP,
      'fatal error while searching member',
    );
  const { schoolId, classId, grade: userGrade /* kidId */ } = qMember.message;

  EXEC_STEP = '3.3'; // #3.3. ???????????? ?????? ?????? ???????????????
  if (!schoolId) {
    const qCon = await QTS.getPostCongrat.fQuery(baseUrl, { postId });
    if (qCon.type === 'error')
      return qCon.onError(res, '3.3', 'searching congrat post');

    EXEC_STEP = '3.3.1';
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
      author_nickname: '??????',
      allowed_member: [],
      allowed_class: [],
      class_name: null,
      school_name: null,
      author_type: '?????????',
      author_grade: 0,
      author_image:
        'https://s3lulla.s3.ap-northeast-2.amazonaws.com/lulla_1614318630221__8940__.png',
    };
    return RESPOND(res, {
      data: { post: congrat, comment: [], like: [] },
      datas: [congrat],
      total_count: 1,
      total_page: 1,
      message: '??????????????? ???????????? ?????????????????????.',
      resultCode: 200,
    });
  }

  EXEC_STEP = '3.8'; // #3.8. memberId??? ?????? ???????????? ?????? ????????? ????????? ????????????.
  const action = 2;
  const qPG = await QTS.getPostGrade.fQuery(baseUrl, { memberId, action });
  if (qPG.type === 'error') return qPG.onError(res, '3.8.1', 'searching likes');

  EXEC_STEP = '3.9';
  let grade;
  if (userGrade > 4) {
    grade = userGrade;
  } else {
    if (qPG.message.rows.length === 0)
      return ERROR(res, {
        resultCode: 401,
        message: '????????? ?????? ?????? ????????? ????????????.',
        id: 'ERR.post.index.3.8.2',
        data: { post: [], total_count: 0, total_page: 0 },
      });
    grade = qPG.message.rows[0].grade;
  }

  EXEC_STEP = '3.10';
  const qCountClass = await QTS.getCountClass.fQuery(baseUrl, { schoolId });
  if (qCountClass.type === 'error')
    return qCountClass.onError(res, '3.8.1', 'searching likes');

  EXEC_STEP = '3.11';
  const { cntClass } = qCountClass.message.rows[0].count;

  let qPost;
  let qTotal;
  if (grade === 1) {
    if (classes.length > 0 && cntClass !== classes.length) {
      EXEC_STEP = '3.12';
      qPost = await QTS.getOne.fQuery(baseUrl, {
        memberId,
        endDate,
        schoolId,
        classes: strClasses,
        isPublished,
        page,
        pageSize,
      });
      qTotal = await QTS.getOneTotal.fQuery(baseUrl, {
        schoolId,
        classes: strClasses,
        memberId,
        isPublished,
      });
    } else if (search) {
      EXEC_STEP = '3.13';
      let qts;
      let qtsCnt;
      if (category.length === 0) {
        qts = QTS.getOneSearchNone;
        qtsCnt = QTS.getOneTotalSearchNone;
      }
      if (category.length === 1 && category[0] === 'contents') {
        qts = QTS.getOneSearchContents;
        qtsCnt = QTS.getOneTotalSearchContents;
      }
      if (category.length === 1 && category[0] === 'author') {
        qts = QTS.getOneSearchAuthor;
        qtsCnt = QTS.getOneTotalSearchAuthor;
      }
      if (category.length === 2) {
        qts = QTS.getOneSearchBoth;
        qtsCnt = QTS.getOneTotalSearchBoth;
      }

      qPost = await qts.fQuery(baseUrl, {
        search,
        memberId,
        endDate,
        schoolId,
        isPublished,
        page,
        pageSize,
      });
      qTotal = await qtsCnt.fQuery(baseUrl, {
        search,
        schoolId,
        isPublished,
      });
    } else if (temp) {
      EXEC_STEP = '3.14';
      qPost = await QTS.getOneTemp.fQuery(baseUrl, {
        memberId,
        endDate,
        isPublished,
      });
      qTotal = await QTS.getOneTotalTemp.fQuery(baseUrl, {
        memberId,
        isPublished,
      });
    } else {
      EXEC_STEP = '3.15';
      qPost = await QTS.getOneElse.fQuery(baseUrl, {
        memberId,
        schoolId,
        endDate,
        isPublished,
        page,
        pageSize,
      });
      qTotal = await QTS.getOneTotalElse.fQuery(baseUrl, {
        schoolId,
        isPublished,
      });
    }
  } else if (grade === 2) {
    EXEC_STEP = '3.16';
    if (search) {
      let qts;
      let qtsCnt;
      if (category.length === 0) {
        qts = QTS.getTwoSearchNone;
        qtsCnt = QTS.getTwoTotalSearchNone;
      }
      if (category.length === 1 && category[0] === 'contents') {
        qts = QTS.getTwoSearchContents;
        qtsCnt = QTS.getTwoTotalSearchContents;
      }
      if (category.length === 1 && category[0] === 'author') {
        qts = QTS.getTwoSearchAuthor;
        qtsCnt = QTS.getTwoTotalSearchAuthor;
      }
      if (category.length === 2) {
        qts = QTS.getTwoSearchBoth;
        qtsCnt = QTS.getTwoTotalSearchBoth;
      }

      qPost = await qts.fQuery(baseUrl, {
        search,
        memberId,
        endDate,
        classId,
        isPublished,
        page,
        pageSize,
      });
      qTotal = await qtsCnt.fQuery(baseUrl, {
        search,
        schoolId,
        isPublished,
      });
    } else if (temp) {
      qPost = await QTS.getTwoTemp.fQuery(baseUrl, {
        memberId,
        endDate,
        isPublished,
      });
      qTotal = await QTS.getTwoTotalTemp.fQuery(baseUrl, {
        memberId,
        isPublished,
      });
    } else {
      qPost = await QTS.getTwoElse.fQuery(baseUrl, {
        memberId,
        schoolId,
        endDate,
        classId,
        isPublished,
        page,
        pageSize,
      });
      qTotal = await QTS.getTwoTotalElse.fQuery(baseUrl, {
        schoolId,
        memberId,
        classId,
        isPublished,
      });
    }
  } else {
    EXEC_STEP = '3.17';
    if (search) {
      let qts;
      let qtsCnt;
      if (category.length === 0) {
        qts = QTS.getElseSearchNone;
        qtsCnt = QTS.getElseTotalSearchNone;
      }
      if (category.length === 1 && category[0] === 'contents') {
        qts = QTS.getElseSearchContents;
        qtsCnt = QTS.getElseTotalSearchContents;
      }
      if (category.length === 1 && category[0] === 'author') {
        qts = QTS.getElseSearchAuthor;
        qtsCnt = QTS.getElseTotalSearchAuthor;
      }
      if (category.length === 2) {
        qts = QTS.getElseSearchBoth;
        qtsCnt = QTS.getElseTotalSearchBoth;
      }

      qPost = await qts.fQuery(baseUrl, {
        search,
        memberId,
        endDate,
        classId,
        isPublished,
        page,
        pageSize,
      });
      qTotal = await qtsCnt.fQuery(baseUrl, {
        search,
        schoolId,
        isPublished,
      });
    } else {
      console.log('===============', 8.7);
      qPost = await QTS.getElseElse.fQuery(baseUrl, {
        memberId,
        schoolId,
        endDate,
        classId,
        isPublished,
        page,
        pageSize,
      });
      qTotal = await QTS.getElseTotalElse.fQuery(baseUrl, {
        schoolId,
        memberId,
        classId,
        isPublished,
      });
    }
  }

  EXEC_STEP = '3.18';
  const post = qPost.message.rows;
  EXEC_STEP = '3.19';
  console.log(qTotal);
  if (qTotal.type === 'error')
    return qTotal.onError(res, '3.2', 'searching total');

  const totalCount = qTotal.message.rows[0].count;
  let totalPage = 0;
  if (temp) totalPage = 1;
  else totalPage = Math.ceil(totalCount / pageSize);

  return RESPOND(res, {
    // data: { post, total_count: totalCount, total_page: totalPage },
    datas: post,
    total_count: totalCount,
    total_page: totalPage,
    message: '???????????? ?????? ??????',
    resultCode: 200,
  });
}
async function detail(req, res) {
  EXEC_STEP = '3.20';
  // #3.1. ????????? ????????? ????????? userId??? ????????????.
  // ??? getUserIdFromToken ????????? user??? ????????? ???????????? ????????????.
  // userId??? ??????????????? ????????????, ???????????? ???????????????.
  const qUserId = await getUserIdFromToken(req.headers.authorization);
  if (qUserId.type === 'error') return qUserId.onError(res, '3.1');
  const userId = qUserId.message;
  EXEC_STEP = '3.21';
  const { member_id: memberId, id: postId } = req.body;

  EXEC_STEP = '3.22';
  // #3.2. member ??????
  const qMember = await POST(
    'school',
    '/checkMember',
    { 'Content-Type': 'application/json' },
    { userId, memberId },
  );
  if (qMember.type === 'error')
    return qMember.onError(
      res,
      EXEC_STEP,
      'fatal error while searching member',
    );
  const { schoolId /* , classId, grade, kidId */ } = qMember.message;

  const endDate = await getFormatDate(new Date());

  // #3.4. ?????? ??????
  const qAM = await QTS.getAMcount.fQuery(baseUrl, { postId });
  if (qAM.type === 'error')
    return qAM.onError(res, '3.4.1', 'counting allowed member');

  EXEC_STEP = '3.23';
  const qAC = await QTS.getACcount.fQuery(baseUrl, { postId });
  if (qAC.type === 'error')
    return qAC.onError(res, '3.4.2', 'counting allowed class');

  EXEC_STEP = '3.24';
  const qSVC = await QTS.getSVcount.fQuery(baseUrl, { postId });
  if (qSVC.type === 'error')
    return qSVC.onError(res, '3.4.3', 'counting survey');

  EXEC_STEP = '3.25';
  const cntAM = qAM.message.rows[0].count;
  const cntAC = qAM.message.rows[0].count;
  const cntSV = qSVC.message.rows[0].count;

  EXEC_STEP = '3.26';
  // #3.5. ???????????? ?????????
  let qts;
  if (cntSV > 0) {
    if (cntAM === 0 && cntAC === 0) qts = QTS.getPDSCTwo;
    else qts = QTS.getPDSCThree;
  } else {
    qts = QTS.getPDSCOne;
  }
  const qPostDetail = await qts.fQuery(baseUrl, {
    postId,
    schoolId,
    memberId,
    endDate,
  });

  EXEC_STEP = '3.27';
  if (qPostDetail.type === 'error')
    return qPostDetail.onError(res, '3.27.1', 'searching post detail');
  const postDetail = qPostDetail.message.rows[0];
  // #3.6. ?????? ?????????
  const qAllComment = await QTS.getAllComments.fQuery(baseUrl, { postId });
  if (qAllComment.type === 'error')
    return qAllComment.onError(res, '3.27.2', 'searching comments');

  EXEC_STEP = '3.28';
  const comment = qAllComment.message.rows;
  // #3.7. ????????? ?????????
  const qAllLikes = await QTS.getAllLikes.fQuery(baseUrl, { postId });
  if (qAllLikes.type === 'error')
    return qAllLikes.onError(res, '3.28.1', 'searching likes');

  EXEC_STEP = '3.29';
  const like = qAllLikes.message.rows;

  return RESPOND(res, {
    data: { post: postDetail, comment, like },
    message: '???????????? ???????????? ??????????????? ?????????????????????.',
    resultCode: 200,
  });
}
function getFormatDate(date) {
  const year = date.getFullYear().toString();
  let month = (1 + date.getMonth()).toString();
  month = month >= 10 ? month : '0'.add(month);
  let day = date.getDate().toString();
  day = day >= 10 ? day : '0'.add(day);
  return year.add('-').add(month).add('-').add(day);
}
