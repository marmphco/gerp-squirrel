NAME = sample-collision
BUILD_DIR = build
JS = $(BUILD_DIR)/$(NAME).js
HTML = $(BUILD_DIR)/index.html

engine: $(JS) $(HTML) $(CSS)

$(JS):
    tsc --project ts --outFile $(JS)

$(HTML): 


$(CSS):
	echo fdsaf

clean:
    - rm $(BUILD_DIR)/*
    - rmdir $(BUILD_DIR)