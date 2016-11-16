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