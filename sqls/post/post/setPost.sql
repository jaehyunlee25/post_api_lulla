update
    post
set
    is_published = ${isPublished},
    published_time = now()
where
    id = '${postId}';