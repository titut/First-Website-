var express = require('express');
var router = express.Router();

const folderView	 = __path_views + 'frontend/pages';
const layoutblog = __path_views + "frontend/frontend";
const CategoryModel = require(__path_schemas + "category");
const ItemsModel = require(__path_schemas + "items");

/* GET home page. */
router.get('/', async function(req, res, next) {
  let getCategory = CategoryModel.find({status: "active"}).exec();
  let getTopPostItems = ItemsModel.find({status:"active"}).exec();
  let getLastestPosts = ItemsModel.find({}).limit(4).sort({"created.time": "desc"}).exec();

  let posts = await ItemsModel.find({}).exec();
  let randomArr = [];
  let randomPosts = [];
  while(randomArr.length < 4){
    let number = Math.floor(Math.random() * posts.length);
    if(!randomArr.includes(number)){
      randomArr.push(number);
    }
  }
  for(let index of randomArr){
    randomPosts.push(posts[index]);
  }

  let category = await getCategory;
  let TopPostItems = await getTopPostItems;
  let LatestPosts = await getLastestPosts;

  res.render(`${folderView}/home/index`, { 
    layout: layoutblog,
    pageTitle   : 'publishPage ',
    top_post: true,
    category,
    TopPostItems,
    LatestPosts,
    randomPosts
  });
});

module.exports = router;
