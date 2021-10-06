update
    post
set
    title = '${title}',
    contents = '${contents}',
    important = '${important}',
    is_published = ${isPublished},
    published_time = ${publishedTime},
    is_modified = ${isModified}
 where
    id = '${postId}';   