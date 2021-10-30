require('dotenv').config();
const express=require("express");
const bodyParser=require("body-parser");
const date=require(__dirname+"/date.js");
const mongoose=require("mongoose");
const _=require("lodash");

const app=express();

app.set("view engine","ejs");
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

const fullDate=date.getDate();
const day=fullDate.substr(0,fullDate.indexOf(' '))


mongoose.connect("mongodb+srv://"+process.env.ADMIN+":"+process.env.PW+"@cluster0.joodz.mongodb.net/todolistDB", {useNewUrlParser: true});


const itemsSchema=new mongoose.Schema({
    name: String
});

const Item=mongoose.model("Item",itemsSchema);

const item1=new Item({
    name: "Welcome to your todolist!"
});
const item2=new Item({
    name: "Hit the + button to add a new item."
});

const item3=new Item({
    name: "Click the checkbox to delete an item."
});

const defaultItems=[item1,item2,item3];


const listSchema={
    name: String,
    items: [itemsSchema]
};

const List=mongoose.model("List",listSchema);


app.get("/",function(req,res){
    
    Item.find(function(err,items){
        if(err){
            console.log(err);
        }else if(items.length===0){
            Item.insertMany(defaultItems,function(err){
                if(err){
                    console.log(err);
                }else{
                    console.log("successful");
                }
            });
            res.redirect("/");
        }else{
            res.render("list",{listTitle: fullDate, newListItems: items});
        }
    })
});

app.post("/",function(req,res){
    const newItem=req.body.newItem;
    const listName=req.body.list;

    const item=new Item({
        name: newItem
    });
    
    if(listName==day){
        item.save(function(){
            res.redirect("/");
        });
    }else{
        List.findOne({name: listName},function(err,foundList){
            foundList.items.push(item);
            foundList.save(function(){
                res.redirect("/"+listName);
            });
        });
    }


    // if(req.body.list==="Work"){
    //     workItems.push(item);
    //     res.redirect("/work");
    // }else{
    //     items.push(item);
    //     res.redirect("/");
    // }
});

app.post("/delete",function(req,res){
    const checkedItemId=req.body.checkbox;
    const listName=req.body.listName;
    
    if(listName==fullDate){
        Item.findByIdAndRemove(checkedItemId,function(err){
            if(err){
                console.log(err);
            }else{
                console.log("Successfuly deleted.");
                res.redirect("/");
            }
        });
    }else{
        List.findOneAndUpdate({name: listName},{$pull: {items: {_id: checkedItemId}}},function(err,foundList){
            if(!err){
                res.redirect("/"+listName);
            }
        });
    } 
});

// app.get("/work",function(req,res){
//     res.render("list",{listTitle:"Work List",newListItems:workItems});
// });

app.get("/:customListName",function(req,res){
    const customListName=_.capitalize(req.params.customListName);
    if(req.params.customListName != "favicon.ico"){
        List.findOne({name: customListName},function(err,foundList){
            if(!err){
                if(!foundList){
                    const list=new List({
                        name: customListName,
                        items: defaultItems
                    });
                    list.save(function(){
                        res.redirect("/"+customListName);
                    });

                }else{
                    res.render("list",{listTitle: foundList.name, newListItems: foundList.items});
                }
            }
        });
    }
});



let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port,function(){
    console.log("Server has started successfully.");
});