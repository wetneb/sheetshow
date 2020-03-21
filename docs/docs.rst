.. _page-docs:

Documenting
===========

This manual is written using Sphinx and the source files can be found in the `docs` folder 
of the repository for this application.
Any contributions to the docs are of course most welcome, as are any suggestions to improve
the coverage of a particular subject.

To build the docs, you first need to install Sphinx, preferably in a Python virtualenv::

   python3 -m venv .venv
   source .venv/bin/activate
   pip install sphinx

You can then go to the docs and generate the HTML::

   make html

The docs are then available in `docs/_build/html/`.
Docs are built automatically when pushed to the repository and are then available on ReadTheDocs,
so you only need to compile them locally if you want to have a preview of what they will look like
after pushing them.
