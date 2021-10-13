select 
    *
from
    post
where
    id in (${postIds})
    and school_id = '${schoolId}';