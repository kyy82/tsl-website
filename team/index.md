---
title: Team
nav:
  order: 2
redirect_from: 
  - people
  - author
---

<h1><a style="text-decoration: none; color: inherit;" href="/members/angeloudis-p.html">Director</a></h1>

{% capture floatcontent %}

<div class="text-center mt-5">
<a style="text-decoration: none; color: inherit;" href="/members/angeloudis-p.html">

  <!-- Avatar -->
  <img src="/images/team/angeloudis-p.jpg"
       style=" max-width: 200px; "
       class="portrait-image"
       />

  <!-- Name & Role -->
  <div class="text-center" style="margin-top: 10px; font-weight: var(--bold); font-size: 1.2rem" > Panagiotis Angeloudis </div> <br>
  <div class="text-center" style="margin-top: -10px"> Professor & Lab Director </div> <br>
</a>

</div>

{% endcapture %}

{% include float.html content=floatcontent %}

{% assign member = site.members | where: "slug", "angeloudis-p" | first %}

<ul style="margin-top: 0; margin-bottom: 15px; padding-left: 0; list-style-position: inside; margin-left: 18px;">
  {% for affiliation in member.affiliations %}
  <li style="margin: 0.1px; padding-left: 0;">{{ affiliation }}</li>
  {% endfor %}
</ul>


<a style="text-decoration: none; color: inherit;" href="/members/angeloudis-p.html">
Professor Panagiotis Angeloudis leads TSL and is part of the Centre for Transport Engineering & Modelling at Imperial.

His research addresses challenges at the intersection of transportation technology and operations management.
 &nbsp;&nbsp;&nbsp;
 <a href="/members/angeloudis-p.html">(more)</a>


{% include section.html %}

# Team

{% include list.html data="members" component="portrait" filters="role: senior" %}
{% include list.html data="members" component="portrait" filters="role: ^(?!pi$|senior$|alumni$)" %}

{% include section.html %}

# Alumni

{% include list.html data="members" component="portrait" filters="role: alumni" %}

{% include section.html dark=true %}

 We are always looking for new members to our team. We will advertise any funded opportunities that specific to our group on LinkedIn, as well as in the UTSG and robotics-worldwide mailing lists, while several scholarship schemes and fellowships are offered by Imperial College London. 
 
 For more information on how to join us, you can review our [recruitment](/apply/) page. 

{% include section.html %}

{% capture content %}

{% include figure.html image="images/photos/itsc.jpg" %}
{% include figure.html image="images/photos/dinner.jpg" %}
{% include figure.html image="images/photos/trb.jpg" %}

{% endcapture %}

{% include grid.html style="square" content=content %}
