var util = require('util')


function processblocks(blocks) {
      for (var i =0; i<blocks.length; i++) {
          console.log(util.inspect(blocks[i]))
          if(blocks[i].setId) {
		blocks[i].setId("5");
	}
          if(blocks[i].hasBlocks && blocks[i].hasBlocks()){
		processblocks(blocks[i].getBlocks())
          }
      }
}


module.exports = function (registry) {
  registry.treeProcessor(function () {
    var self = this
    self.process(function (doc) {
      blocks = doc.getBlocks()
      processblocks(blocks)
      return doc
    })
  })
}
