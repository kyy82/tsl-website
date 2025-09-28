---
title: Projects
nav:
  order: 2
---

# {% include icon.html icon="fa-solid fa-flask" %}Research Projects

Our work addresses modelling challenges in transportation and infrastructure systems. We combine specialised scientific software development expertise with advanced machine learning and optimisation methods developed and utilised in our research, focusing on applications in vehicle autonomy, freight logistics, construction, maritime transport, and infrastructure management.

Through both fundamental research and applied industry collaborations, we develop innovative solutions and models aimed at improving efficiency, safety, and sustainability in transportation and infrastructure.

{% include project-tags.html %}

{% for project in site.data.projects %}
    {% include project-card.html project=project %}
{% endfor %}


{% capture content %}
For a list of recent research outputs, visit our [publications page](/papers/).
{% endcapture %}

{% include more-info.html 
  content=content 
  icon="fa-solid fa-file-lines" 
  color="#0A66C2" 
%}