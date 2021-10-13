select
    *
from
    likes
where
    member_id = '${memberId}'
    and post_id = '${postId}';