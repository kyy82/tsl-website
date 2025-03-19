---
title: News
nav:
  order: 1
  tooltip: Latest news and updates
---

# {% include icon.html icon="fa-solid fa-newspaper" %}News & Updates

{% include news-list.html style="calendar" expanded=true %}


{% capture content %}
For earlier news and updates, please visit our [LinkedIn page](https://www.linkedin.com/in/p-angeloudis/recent-activity/all/){:target="_blank" rel="noopener"}.
{% endcapture %}

{% include more-info.html 
  content=content 
  icon="fa-brands fa-linkedin" 
  color="#0A66C2" 
%}