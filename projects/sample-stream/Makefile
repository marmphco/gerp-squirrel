NAME = sample-stream
TS = $(shell find ts | grep \\.ts)
JS = build/js/$(NAME).js
HTML = build/index.html

ENGINE = build/js/gerp-squirrel.js
ENGINE_SRC = ../engine/build/gerp-squirrel.js

all: $(JS) $(HTML) $(ENGINE)

$(JS): $(TS)
	tsc --project ts --outFile $(JS)

$(HTML): html/index.html
	cp $< $@

$(ENGINE): $(ENGINE_SRC)
	cp $< $@

clean:
	- rm -r build
