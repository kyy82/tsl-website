---
title: Research
nav:
  order: 2
  tooltip: Our research projects
---

# {% include icon.html icon="fa-solid fa-flask" %}Research Projects

Our research at the Transport Systems & Logistics Laboratory focuses on innovative solutions for complex transportation challenges. We develop advanced algorithms, simulation models, and optimization techniques to improve efficiency, safety, and sustainability in transport systems.

{% include project-tags.html %}

{% for project in site.data.projects %}
    {% include project-card.html project=project %}
{% endfor %}

<script src="{{ '/project-filtering.js' | relative_url }}"></script>