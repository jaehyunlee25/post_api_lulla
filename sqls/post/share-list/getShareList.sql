select 
    CASE 
        WHEN 
            count(am.post_id) = 0 and count(ac.post_id) = 0 
        THEN 
            -- non_response_all
            (select array_to_json(
                array(
                    select row_to_json(tmp) 
                    from 
                        (select m.id, 
                                CASE 
                                    WHEN sr.grade = 1 THEN concat(s.name) 
                                    WHEN sr.grade < 3 THEN concat(u.name,' ',sr.name) 
                                    WHEN sr.grade < 5 THEN concat(c.name,' ',u.name,' ','선생님') 
                                    WHEN sr.grade = 5 THEN concat(c.name,' ',k.name,'(',m.nickname,')') 
                                END member_nickname,
                                c.name class_name, 
                                k.name kid_name,
                                f.address member_image 
                            from members m 
                                join school_roles sr on sr.id = m.school_role_id
                                join schools s on s.id = m.school_id
                                left join survey_member sm on sm.member_id = m.id
                                left join file f on f.id = m.image_id
                                left join class c on c.id = m.class_id
                                left join kid k on k.id = m.kid_id
                                left join survey on survey.id = sm.survey_id
                                left join post p on survey.post_id = p.id
                                join users u on u.id = m.user_id
                            where 
                                m.id in 
                                        -- all_member
                                        (select m.id from members m
                                            join school_roles sr on sr.id = m.school_role_id
                                            where m.school_id = '${schoolId}'
                                            and sr.grade > 4)
                                and (m.id not in 
                                                -- survey_member
                                                (select 
                                                        sm.id 
                                                    from survey_member sm 
                                                            left join survey s on s.id = sm.survey_id 
                                                    where s.post_id = '${postId}')
                                                ) 
                                and sr.grade = 5
                        ) tmp
                )
            )non_response) 
        WHEN 
            count(am.post_id) != 0 or count(ac.post_id) != 0 
        THEN
            --  non_response_not_all
            (select array_to_json(
                array(
                    select 
                        row_to_json(tmp) 
                    from (select m.id, 
                                CASE 
                                    WHEN sr.grade = 1 THEN concat(s.name) 
                                    WHEN sr.grade < 3 THEN concat(u.name,' ',sr.name) 
                                    WHEN sr.grade < 5 THEN concat(c.name,' ',u.name,' ','선생님') 
                                    WHEN sr.grade = 5 THEN concat(c.name,' ',k.name,'(',m.nickname,')') 
                                END member_nickname,
                                c.name class_name, 
                                k.name kid_name,
                                f.address member_image 
                            from 
                                members m 
                                    join school_roles sr on sr.id = m.school_role_id
                                    join schools s on s.id = m.school_id
                                    left join survey_member sm on sm.member_id = m.id
                                    left join file f on f.id = m.image_id
                                    left join class c on c.id = m.class_id
                                    left join kid k on k.id = m.kid_id
                                    left join survey on s.id = sm.survey_id
                                    left join post p on survey.post_id = p.id
                                    join users u on u.id = m.user_id
                            where 
                                (
                                    m.id in 
                                            -- allowed_member
                                            (select 
                                                    am.member_id 
                                                from 
                                                    allowed_member am 
                                                where 
                                                    am.post_id = '${postId}'
                                            ) 
                                    or m.id in 
                                                -- allowed_class_member
                                                (select 
                                                    m.id 
                                                from 
                                                    members m 
                                                where 
                                                    m.class_id in (select 
                                                                        ac.class_id 
                                                                    from 
                                                                        allowed_class ac 
                                                                    where 
                                                                        ac.post_id = '${postId}')
                                                )
                                ) 
                                and (m.id not in 
                                                    -- survey_member
                                                    (select 
                                                        sm.id 
                                                    from 
                                                        survey_member sm 
                                                            left join survey s on s.id = sm.survey_id 
                                                    where 
                                                        s.post_id = '${postId}')
                                    )
                                and sr.grade = 5
                        ) 
                tmp)
            ) non_response)
    END non_response,
    -- department
    (select 
        array_to_json(
            array(
                select 
                    row_to_json(tmp) 
                from 
                    (select 
                        c.id class_id, 
                        c.name class_name 
                    from 
                        class c 
                            left join allowed_class ac on ac.class_id = c.id 
                    where 
                        ac.post_id = '${postId}'
                    ) tmp
            )
        ) 
    class_list),
    CASE 
        WHEN 
            count(am.post_id) = 0 and count(ac.post_id) = 0 
        THEN
            -- individual_all
            (select array_to_json(
                array(
                    select row_to_json(tmp) from 
                    (select m.id,
                        CASE 
                            WHEN sr.grade = 1 THEN concat(s.name) 
                            WHEN sr.grade < 3 THEN concat(u.name,' ',sr.name) 
                            WHEN sr.grade < 5 THEN concat(c.name,' ',u.name,' ','선생님') 
                            WHEN sr.grade = 5 THEN concat(c.name,' ',k.name,'(',m.nickname,')') 
                        END member_nickname,
                        f.address member_image
                    from members m
                        join school_roles sr on sr.id = m.school_role_id
                        join schools s on s.id = m.school_id
                        left join class c on c.id = m.class_id
                        left join kid k on k.id = m.kid_id
                        left join file f on f.id = m.image_id
                        join users u on u.id = m.user_id 
                    where 
                        m.id in 
                                -- all_member
                                (select m.id from members m
                                join school_roles sr on sr.id = m.school_role_id
                                where m.school_id = '${schoolId}'
                                and sr.grade > 4)
                        and  sr.grade = 5
                    ) tmp
                )
            )individual) 
        WHEN 
            count(am.post_id) != 0 or count(ac.post_id) != 0 
        THEN 
            -- individual_not_all
            (select array_to_json(
                array(
                    select row_to_json(tmp) 
                    from 
                        (select m.id,
                            CASE 
                                WHEN sr.grade = 1 THEN concat(s.name) 
                                WHEN sr.grade < 3 THEN concat(u.name,' ',sr.name) 
                                WHEN sr.grade < 5 THEN concat(c.name,' ',u.name,' ','선생님') 
                                WHEN sr.grade = 5 THEN concat(c.name,' ',k.name,'(',m.nickname,')') 
                            END member_nickname,
                            f.address member_image
                            from members m 
                                join school_roles sr on sr.id = m.school_role_id
                                join schools s on s.id = m.school_id
                                left join class c on c.id = m.class_id
                                left join kid k on k.id = m.kid_id
                                left join file f on f.id = m.image_id
                                join users u on u.id = m.user_id
                            where 
                                (
                                    m.id in 
                                            -- allowed_member
                                            (select am.member_id from allowed_member am where am.post_id = '${postId}')
                                    or m.id in 
                                            -- allowed_class_member
                                            (select m.id 
                                            from members m 
                                            where 
                                                m.class_id in 
                                                                -- allowed_class
                                                                (select ac.class_id 
                                                                from allowed_class ac 
                                                                where ac.post_id = '${postId}')
                                            )
                                ) 
                                and sr.grade = 5
                        ) tmp
                    )
            )individual)
    END individual
from post p 
    left join allowed_member am on am.post_id = p.id
    left join allowed_class ac on ac.post_id = p.id
where p.id = '${postId}';