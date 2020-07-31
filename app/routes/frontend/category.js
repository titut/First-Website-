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

  res.render(`${folderView}/category/listcategories`, { 
    layout: layoutblog,
    pageTitle   : 'publishPage ',
    top_post: false,
    category,
    randomPosts
  });
});

router.get('(/:slug)?', async function(req, res, next) {
    let getCategory = CategoryModel.find({status: "active"}).exec();
    let category = await getCategory;
    let Getgroup = CategoryModel.find({slug: req.params.slug}).exec();
    let group = await Getgroup;
    let getItems = ItemsModel.find({"category.name": group[0].name}).sort({"created.time": "desc"}).exec();
    let items = await getItems;

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
  
    res.render(`${folderView}/category/index`, { 
      layout: layoutblog,
      pageTitle   : 'publishPage ',
      top_post: false,
      category,
      group,
      items,
      randomPosts
    });
  });

module.exports = router;
