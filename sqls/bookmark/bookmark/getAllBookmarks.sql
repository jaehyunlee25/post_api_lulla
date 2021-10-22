select 
    p.title title, 
    p.contents contents,
    to_char(p.published_time, 'YYYY-MM-DD"T"HH24:MI:ss.MS"Z"') published_time,
    p.important important, 
    CASE 
        WHEN sr.grade = 1 THEN concat(s.name) 
        WHEN sr.grade < 3 THEN concat(u.name,' ',sr.name) 
        WHEN sr.grade < 5 THEN concat(c.name,' ',u.name,' ','선생님') 
        WHEN sr.grade = 5 THEN concat(c.name,' ',k.name,'(',m.nickname,')') 
    END author_nickname,
    m.id author_id, 
    sr.grade author_grade,
    sr.name author_type, 
    s.name school_name, 
    c.name class_name, 
    f.address author_images,
    b.id, b.type, 
    CASE 
        WHEN b.post_id is not null and b.type = 1 THEN b.post_id 
        WHEN b.post_id is null or b.type = 2 THEN null 
    END post_id,
    CASE 
        WHEN b.post_id is not null and b.type = 2 THEN b.post_id 
        WHEN b.post_id is null THEN pf.post_id 
        WHEN b.post_id is not null and b.type = 1 THEN null 
    END album_id,
    b.image_id, 
    i.type file_type, 
    CASE 
        WHEN b.type = 3 THEN i.address 
        WHEN b.type = 2 THEN (select fi.address from file fi join post_file pfi on fi.id = pfi.file_id where pfi.post_id = p.id limit 1 ) 
        WHEN b.type = 1 THEN null 
    END album_image
from bookmark b 
    left join post p on b.post_id = p.id
    left join members m on p.author_id = m.id
    left join school_role sr on m.school_role_id = sr.id
    left join users u on u.id = m.user_id
    left join kid k on k.id = m.kid_id
    left join class c on c.id = m.class_id
    left join schools s on s.id = m.school_id
    left join file f on f.id = m.image_id
    left join file i on i.id = b.image_id
    left join post_file pf on pf.file_id = i.id
where 
    b.member_id = '${memberId}' 
order by 
    b.created_at DESC