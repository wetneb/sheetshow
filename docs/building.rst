.. _page-tagging:

Building
========

Getting started
---------------

To make changes to the application, you will need Node.js and NPM, its package manager. Install them `here <https://www.npmjs.com/get-npm>`_.

Running locally
---------------

To run the application locally, use::

   npm start

This will spin a development web server and you will be able to view the application at `http://localhost:8080/ <http://localhost:8080/>`_. The application will reload automatically when you change files.

Deploying
---------

To publish the app to GitHub Pages, use::

   npm run deploy

This will compile the app and upload it to the `gh-pages` branch.

Compiling the embeddable script
-------------------------------

To compile the embeddable script used to render diagrams in third-party web pages, run::

   npm run embed

This will generate the script at `dist/embed/sheetshow.js`.
