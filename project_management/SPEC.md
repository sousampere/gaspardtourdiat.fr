# GaspardTourdiat.fr — Specification document

> Personal portfolio website built with React.

## Pages

### Home (/)

This page will give a brief presentation of me. It needs to include :

- One small text banner saying what I'm currently looking for with text scrolling right to left
- A punchline, a very short self-presentation with my picture and some statistics (number of projects, commits, years of experience)
- A "Banner" that shows exery Languages, Frameworks, and tools I mastered, with some small details about it
- A gradient background that follows my mouse
- A section with links to my Github, my CV and my Linkedin
- A link to the projects page

### Projects (/projects)

This page will show all projects. Projects are Markdown files located in the ./projects_markdowns directory. It gives a date depending on the Markdown file date. When clicking on a project, the Markdown content appears under the project list, and the browser automatically navigates downwards to the head of the Markdown file content.

### About (/about)

This page gives more informations about me and my school. It contains :

- My current city
- A section about my passion in computer science
- My scolarship (baccalauréat, GEA, School 42, why I switched)
- School 42 description (p2p, deadlines, self-project management, group projects)
- My passions (Building solutions, social medias)
- Languages levels
- What I would do if I wasn't coding

### Contact (/contact)

This page gives informations about how to contact me :

- Linkedin
- GitHub
- Mail

## Components

### Navbar

Must be a MacOS-like window floating, fixed. It includes the website's name on the left, and all pages links on the right. On Mobile, it contains a drawer-menu instead of links.