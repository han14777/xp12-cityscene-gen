PYTHON ?= python

.PHONY: gui test

gui:
	$(PYTHON) -m cityscene gui

test:
	$(PYTHON) -m pytest -q
