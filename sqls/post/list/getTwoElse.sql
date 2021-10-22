select
    -- default cols
    p.id id, 
    p.title title, 
    p.contents contents, 
    p.is_modified is_modified,
    to_char(p.published_time, 'YYYY-MM-DD"T"HH24:MI:ss.MS"Z"') published_time, 
    p.important, p.author_id,
    to_char(p.created_at, 'YYYY-MM-DD"T"HH24:MI:ss.MS"Z"') created_at, 
    s.id survey_id, 
    to_char(s.end_date, 'YYYY-MM-DD"T24:00:00.000Z"') survey_end_date,
    -- like_count
    CAST(
        (select count(*) 
        from likes l 
        where l.post_id = p.id
        ) AS INTEGER
    ) like_count,
    -- comment_count
    CAST(
        (select count(*) 
        from comment c 
        where 
            c.post_id=p.id
            or c.id in (select tc.tocomment_id 
                        from tocomment tc
                        where tc.comment_id in (select dc.id 
                                                from comment dc 
                                                where dc.post_id=p.id)
                        )
        ) AS INTEGER 
    ) comment_count,
    -- is_like
    (1=CAST(
        (select 
            count(*) 
        from likes l 
            join member m on l.member_id = m.id 
        where 
            l.post_id = p.id 
            and l.member_id ='${PostInputDTO.member_id}') AS INTEGER
        )
    ) is_like,
    -- is_bookmark
    (1=CAST(
        (select count(*) 
        from bookmark b 
            join members m on b.member_id = m.id 
        where b.post_id = p.id 
            and b.member_id ='${memberId}'
        ) AS INTEGER)
    ) is_bookmark,
    -- member_name
    (select 
        CASE 
            WHEN sr.grade = 1 THEN concat(s.name) 
            WHEN sr.grade < 3 THEN concat(u.name,' ',sr.name) 
            WHEN sr.grade < 5 THEN concat(c.name,' ',u.name,' ','선생님') 
            WHEN sr.grade = 5 THEN concat(c.name,' ',k.name,'(',m.nickname,')') 
        END
    from members m 
        left join kid k on k.id = m.kid_id 
        join users u on u.id = m.user_id 
        join schools s on m.school_id = s.id 
        left join class c on c.id = m.class_id 
        join school_roles sr on m.school_role_id =sr.id 
    where m.id = p.author_id
    ) author_nickname,
    -- allowed_member
    (select array_to_json(
        array(
            select row_to_json(tmp) 
            from (select 
                    CASE 
                        WHEN sr.grade = 1 THEN concat(s.name) 
                        WHEN sr.grade < 3 THEN concat(u.name,' ',sr.name) 
                        WHEN sr.grade < 5 THEN concat(c.name,' ',u.name,' ','선생님') 
                        WHEN sr.grade = 5 THEN concat(c.name,' ',k.name,'(',m.nickname,')') 
                    END member_nickname,
                    m.id member_id, 
                    f.address member_image, 
                    k.name kid_name, 
                    c.name class_name, 
                    c.id class_id 
                from allowed_member am
                    join members m on am.member_id = m.id 
                    left join file f on m.image_id = f.id
                    join class c on m.class_id = c.id 
                    left join kid k on k.id = m.kid_id
                    join school_roles sr on sr.id = m.school_role_id 
                    join schools s on s.id = m.school_id
                    join users u on u.id = m.user_id
                where am.post_id = p.id
                ) tmp
            )
        ) allowed_member
    ),
    -- allowed_class
    (select array_to_json(
        array(
            select row_to_json(tmp) 
            from (select 
                    c.name class_name, 
                    c.id class_id, 
                    (select array_to_json(
                        array(
                            select row_to_json(tmp) 
                            from (select 
                                    CASE 
                                        WHEN sr.grade = 1 THEN concat(s.name) 
                                        WHEN sr.grade < 3 THEN concat(u.name,' ',sr.name) 
                                        WHEN sr.grade < 5 THEN concat(c.name,' ',u.name,' ','선생님') 
                                        WHEN sr.grade = 5 THEN concat(c.name,' ',k.name,'(',m.nickname,')') 
                                    END member_nickname,
                                    m.id member_id,
                                    f.address member_image, 
                                    c.name class_name, 
                                    c.id class_id, 
                                    k.name kid_name
                                from members m 
                                    join users u on u.id = m.user_id 
                                    left join file f on m.image_id = f.id 
                                    left join class c on c.id = m.class_id 
                                    left join kid k on k.id = m.kid_id 
                                    join school_roles sr on sr.id = m.school_role_id 
                                    join schools s on s.id = m.school_id
                                where 
                                    m.class_id = ac.class_id 
                                    and m.kid_id is not null
                                ) tmp)
                            ) allowed_member
                        )
                from allowed_class ac
                    join class c on ac.class_id = c.id 
                where ac.post_id = p.id
            ) tmp
        )
    ) allowed_class),
    -- class_name
    (select c.name 
    from members m 
        join class c on m.class_id =c.id 
    where m.id = p.author_id
    ) class_name,
    -- school_name
    (select s.name 
    from members m 
        join schools s on m.school_id =s.id 
    where m.id = p.author_id
    ) school_name,
    -- author_type
    (select r.name 
    from members m 
        join school_roles r on m.school_role_id =r.id 
    where m.id = p.author_id
    ) author_type,
    -- member_grade
    (select r.grade 
    from members m 
        join school_roles r on m.school_role_id =r.id 
    where m.id = p.author_id
    ) author_grade,
    -- images
    (select array_to_json(
        array(
            select row_to_json(tmp) 
            from (select 
                    f.id, 
                    f.address, 
                    f.size, 
                    f.thumbnail_address, 
                    f.type, 
                    f.name, 
                    f.width, 
                    f.height, 
                    f.index, 
                    f.duration 
                from file f 
                    left join post_file pf on f.id = pf.file_id
                where 
                    pf.post_id = p.id 
                    and (f.type='image' or f.type='video')
                order by f.index
                ) tmp
            )
        ) images
    ),
    -- files
    (select array_to_json(
        array(
            select row_to_json(tmp) 
            from (select 
                    f.id, 
                    f.address, 
                    f.size, 
                    f.thumbnail_address, 
                    f.type, 
                    f.name 
                from file f 
                    left join post_file pf on f.id = pf.file_id
                where 
                    pf.post_id = p.id 
                    and (f.type !='image' and f.type !='video')
                ) tmp
            )
        ) files
    ),
    -- author_image
    (select f.address 
    from file f 
        left join members on members.id = p.author_id 
    where f.id = members.image_id) author_image,
    -- complete_survey
    (1=CAST(
        (select count(*) 
        from survey_member sm 
            join members m on sm.member_id = m.id 
        where 
            sm.survey_id = s.id 
            and sm.member_id ='${memberId}'
        ) AS INTEGER)
    ) complete_survey,
    -- survey_end
    (select (select s.end_date) < '${endDate}') survey_end,
    -- question_count
    CAST(
        (select count(*) 
        from survey_question sq 
        where sq.survey_id = s.id
        ) AS INTEGER
    ) question_count

from
    post p
    left join survey s on s.post_id = p.id
where
    p.is_published = ${isPublished}
    and p.post_type = 0
    and (
            (
                -- principle data
                (
                    p.school_id = '${schoolId}'
                    and 0 = (select count(*) from allowed_member am where am.post_id = p.id )
                    and 0 = (select count(*) from allowed_class ac where ac.post_id = p.id)
                )

                or p.author_id = '${memberId}'
            )
            -- allowed_class_compare
            or 1 = (select count(*) 
                    from allowed_class ac 
                    where 
                        ac.post_id = p.id 
                        and ac.class_id = '${classId}'
                    )
        )
order by
    p.published_time desc
offset ${page}
limit ${pageSize};