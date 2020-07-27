var express = require('express');
var router = express.Router();

const folderView	 = __path_views + 'frontend/pages';
const layoutblog = __path_views + "frontend/frontend";
const CategoryModel = require(__path_schemas + "category");
const ItemsModel = require(__path_schemas + "items");

/* GET home page. */
router.get('/', async function(req, res, next) {
  let getCategory = CategoryModel.find({status: "active"}).exec();
  let category = await getCategory;
  let getItems = ItemsModel.find({status:"active"}).exec();
  let items = await getItems;

  res.render(`${folderView}/home/index`, { 
    layout: layoutblog,
    pageTitle   : 'publishPage ',
    top_post: true,
    category,
    items
  });
});

module.exports = router;
