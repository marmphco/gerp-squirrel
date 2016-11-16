NAME = gerp-squirrel
BUILD_DIR = build
TS = $(shell find ts | grep \\.ts)
JS = $(BUILD_DIR)/$(NAME).js
DTS = $(BUILD_DIR)/$(NAME).d.ts
PRODUCTS = $(JS) $(DTS)

engine: $(PRODUCTS)

$(PRODUCTS): $(TS)
	tsc --project ts --outFile $(JS)

clean:
	- rm $(BUILD_DIR)/*
	- rmdir $(BUILD_DIR)