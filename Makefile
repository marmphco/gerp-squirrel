TSC = tsc --project

all: engine sample-collision sample-stream

clean: clean-engine clean-sample-collision clean-sample-collision

engine:
	$(MAKE) -C projects/engine

clean-engine: 
	$(MAKE) -C projects/engine clean

sample-collision: engine
	$(MAKE) -C projects/sample-collision

clean-sample-collision:
	$(MAKE) -C projects/sample-collision clean

sample-stream: engine
	$(MAKE) -C projects/sample-stream

clean-sample-stream:
	$(MAKE) -C projects/sample-stream clean

# SAMPLE_NAME = sample-stream
# SAMPLE_DIR = projects/$(SAMPLE_NAME)
# SAMPLE_BUILD_DIR = $(SAMPLE_DIR)/build
# SAMPLE_JS = $(SAMPLE_BUILD_DIR)/js/$(SAMPLE_NAME).js
# SAMPLE_CSS = $(SAMPLE_BUILD_DIR)/css
# SAMPLE_INDEX = $(SAMPLE_BUILD_DIR)/index.html

# sample: $(SAMPLE_BUILD_DIR) $(SAMPLE_BUILD_DIR)/js/$(ENGINE_NAME).js $(SAMPLE_JS) $(SAMPLE_CSS) $(SAMPLE_INDEX)

# clean-sample:
# 	- rm -r $(SAMPLE_BUILD_DIR)

# $(SAMPLE_BUILD_DIR):
# 	mkdir $@

# $(SAMPLE_BUILD_DIR)/js/$(ENGINE_NAME).js: $(ENGINE_JS)
# 	- mkdir $(SAMPLE_BUILD_DIR)/js
# 	cp $< $@

# $(SAMPLE_JS): $(SAMPLE_DIR)/ts/$(SAMPLE_NAME).ts
# 	tsc --project $(SAMPLE_DIR)/ts --outFile $(SAMPLE_JS)

# $(SAMPLE_CSS): $(SAMPLE_DIR)/css
# 	cp -R $< $@

# $(SAMPLE_INDEX): $(SAMPLE_DIR)/html/index.html
# 	cp $< $@