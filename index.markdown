---
layout: home
title: Home
---

<div class="posts">
  {% for post in site.posts %}
    <article class="post">
      <h2><a href="{{ site.baseurl }}{{ post.url }}">{{ post.title }}</a></h2>
      <div class="date">
        {{ post.date | date: "%B %e, %Y" }}
      </div>
      {% if post.description %}
        <div class="description">{{ post.description }}</div>
      {% endif %}
      <div class="content">
        {{ post.content | strip_html | newline_to_br | strip_newlines | split: '<br />' | first | append: '<br />' }}
        {{ post.content | strip_html | newline_to_br | strip_newlines | split: '<br />' | slice: 1 | first | append: '<br />' }}
        {{ post.content | strip_html | newline_to_br | strip_newlines | split: '<br />' | slice: 2 | first }}
      </div>
    </article>
  {% endfor %}
</div>
