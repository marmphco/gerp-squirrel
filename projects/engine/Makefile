NAME = gerp-squirrel
BUILD_DIR = build
JS = $(BUILD_DIR)/$(NAME).js
DTS = $(BUILD_DIR)/$(NAME).d.ts
PRODUCTS = $(JS) $(DTS)

engine: $(PRODUCTS)

$(PRODUCTS): ts/*
	tsc --project ts --outFile $(JS)

clean:
	- rm $(BUILD_DIR)/*
	- rmdir $(BUILD_DIR)