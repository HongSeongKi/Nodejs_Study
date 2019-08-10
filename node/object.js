var member=["abc","def","ghi"];

for(var i =0;i<member.length;i++)
{
    console.log("Array => ",member[i]);
}

var list ={
    "a":"bcd",
    "b":"cde",
    "c":"def"
};

for(var name in list)
{
    console.log("object =>", name);
    console.log(list[name]);
}