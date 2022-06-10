var util = require('util')

var counter = 0

function processblocks(blocks) {
      for (var i =0; i<blocks.length; i++) {
          if(blocks[i].getId && blocks[i].setId) {
                if(!blocks[i].getId()) { // only add id if no existing id
		      blocks[i].setId("comment_"+counter++);
		}
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
