select 
    file_id 
from 
    post_file 
where 
    post_id in (${delPostIds});