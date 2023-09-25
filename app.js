//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect(`mongodb+srv://admin-billy:strongerwu@cluster0.gglhyqm.mongodb.net/?retryWrites=true&w=majority&appName=AtlasApp/todolistDB`, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Successfully connected to MongoDB');
}).catch(err => {
  console.error('Error connecting to MongoDB', err);
});

const itemsSchema = {
  name:String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your Todo List."
});

const item2 = new Item({
  name: "Check emails."
});

const item3 = new Item({
  name: "Buy Groceries."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {
  Item.find({}).then(foundItems => {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems)
        .then(() => {
          console.log("Successfully saved default items to DB.");
          res.redirect("/");
        })
        .catch(err => {
          console.log(err);
        });
    } else {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  }).catch(err => {
    console.error('Error fetching items:', err);
  });
});

app.get("/about", function(req, res){
  res.render("about");
});

app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName})
  .then(list => {
    if(list){
      //Show an existing list
      res.render("list", {listTitle: list.name, newListItems: list.items});
    } else {
      //Create a new list
      console.log("Creating a new list:", customListName);
      const list = new List ({
        name: customListName,
        items: defaultItems
      });
      return list.save().then(() => {
        res.redirect("/" + customListName);
      });
    }
  })
  .catch(err => {
    console.log("An err occurred", err);
  });
});

app.post("/", function(req, res){

  const itemName = req.body.newItem;  //把新输入的data加进去
  const listName = req.body.list;

  const item = new Item({
    name:itemName
  });

  if( listName === "Today"){
    item.save()  // 操作完成后再执行重定向，确保数据保存成功
    .then(() => {
      res.redirect("/");
    })
    .catch(err => {
      console.error(err);
    });
  } else {
    List.findOne({name: listName})
    .then((foundList)=> {
      if (!foundList) {
        console.error('List not found for the given listName:', listName);
        return;
      }
      foundList.items.push(item);
      return foundList.save();
    })
    .then(()=> {
      res.redirect("/" + listName);
    })
    .catch(err => {
      console.log("Error", err);
    })
  }
});

app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today"){
    Item.findByIdAndRemove(checkedItemId)
    .then((result)=> {
      if (result){
        console.log('Document removed:', result);
        res.redirect("/");
      } else {
        console.log('No document found with that ID.');
      }
    })
    .catch((err)=> {
      console.log('Error removing document', err);
    })
  } else {
    List.findOneAndUpdate({name: listName}, {$pull:{items: {_id: checkedItemId}}})
    .then((result) => {
        res.redirect("/" + listName);
    })
    .catch((err) => {
        console.log('Error updating list:', err);
    });
  }
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
