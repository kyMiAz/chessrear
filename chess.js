const express = require('express');
const app = express();
const fs = require('fs');
//引入数据库模块
const {Sequelize,Model,DataTypes} = require('sequelize');
const sequelize = new Sequelize('sqlite:chessboard.db');
//fromdata
const multipart = require('connect-multiparty');
const multipartMiddleware = multipart();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


//创建一个User对象继承Model
class Chess extends Model{}
//初始化User对象
Chess.init({
    id:{
        //int类型
        type: DataTypes.INTEGER,
        //主键
        primaryKey: true,
        //自增
        autoIncrement: true
    },
    init:{
        //int类型
        type: DataTypes.STRING(255),
        allowNull:false,
    },
    after: {
        //类型是String类型，相当于Varchar(50)
        type: DataTypes.STRING(255),
        allowNull:false,
    },
    weight:{
        type:DataTypes.INTEGER,
        allowNull:false,
        defaultValue:0
    },
},{sequelize,modelName: 'chess'});
Chess.sync();

//参数
let rawdata = fs.readFileSync('final_result_2.json');
let suggest = JSON.parse(rawdata);
let chess = new Map();;
let chessName = ["红车","红马","红相","红士","红帅","红士","红相","红马",
                "红车","红炮","红炮","红兵","红兵","红兵","红兵","红兵",
                "黑车","黑马","黑相","黑士","黑将","黑士","黑相","黑马",
                "黑车","黑炮","黑炮","黑卒","黑卒","黑卒","黑卒","黑卒"]


//机器学习
//机器走棋
app.post('/memorize/',multipartMiddleware,(req, res) => {
    let x = req.body.x;
    let y = req.body.y;
    Chess.findOne({where:{init:x,after:y}}).then(chess => {
        if(chess){
            let w = chess.weight +1 ;
            chess.update({
                weight:w
            }).then(()=>{
                res.status(200).send();
                return;
            })
        }
        else{
            Chess.create({
                init: x,
                after: y,
                weight: 1
                }).then(()=>{
                    go = true;
                    res.status(200).send();
                    return;
                })
        }
        res.status(202).send();
    })
})

//机器走棋
app.get('/suggest/:x',(req, res) => {
    let x = req.params.x;
    for(i =0;i<suggest.length;i++){
        if(x == suggest[i].init){
            let y = modifyPos(suggest[i].init,suggest[i].move);
            res.json(y).status(200);
            return;
        }
    }
    Chess.findAll({where: {init: x}}).then(chess =>{
        let y;
        if(chess.length!=0){
            if(chess.length == 1){
                y = chess[0].after;
            }
            else{
                let max =0;
                let index = 0;
                for(i=0;i<chess.length;i++)
                {
                    if(chess[i].weight>max){
                        max = chess[i].weight;
                        index = chess[i].id-1; 
                    }
                }
                console.log(index);
                console.log(chess[index]);
                y = chess[index].after;
            }
            res.json(y).status(200);   
            return;
        }
        else{res.status(201).send();return;} 
    })
})

//人类走棋
app.get('/move/:x/:move',(req, res) => {
    let x = req.params.x;
    let move = req.params.move;
     //返回参数
     let y;
     //位置参数
     let x1 = move.substr(0,1);
     let y1 = move.substr(1,1);
     let x2 = move.substr(2,1);
     let y2 = move.substr(3,1);
     let pos1 = move.substr(0,2);
     let pos2 = move.substr(2,2);
     sliceChess(x);
     if(chess.has(pos1)){
         //得到棋子类型
         let name = chess.get(pos1);
         //判断棋子行进方式
         switch(name.substr(1,1)){
             case "车":
                 //是否直线
                 if(x2 == x1 || y2 == y1){
                     let min = Math.min(parseInt(pos1),parseInt(pos2));
                     let max = Math.max(parseInt(pos1),parseInt(pos2));
                     //上下
                    if(x2 == x1){
                         for(i = min+1;i < max; i+=1){
                             let p;
                             if(i<10) p = "0"+i;
                             else p = i.toString();
                             if(chess.has(p)){
                                 res.status(500).send();
                                 chess.clear();
                                 return;
                             }
                         }
                         hasChess(pos1,pos2,x,y,x2,y2,move,res);
                    }
                    //左右
                    else{
                         for(i = min+10;i < max; i+=10){
                             if(chess.has(i.toString())){
                                res.status(500).send();
                                chess.clear();
                                 return;
                             }
                         }
                         hasChess(pos1,pos2,x,y,x2,y2,move,res);
                    }
                 }
                 else {res.status(500).send();chess.clear(); return;}
                 break;
             case "马":
                 x1 = parseInt(x1);
                 x2 = parseInt(x2);
                 y1 = parseInt(y1);
                 y2 = parseInt(y2);
                 //判断是否走日字
                 if((Math.abs(x1 - x2) == 1 && Math.abs(y1-  y2) == 2)
                 || (Math.abs(x1 - x2) == 2 && Math.abs(y1 - y2) == 1)){
                     //上
                     if(y1 - y2 == 2){
                         if(chess.has((x1.toString()+(y1-1).toString()))){
                            res.status(500).send();
                            chess.clear();
                             return;                           
                         }
                         hasChess(pos1,pos2,x,y,x2.toString(),y2.toString(),move,res);
                     }
                     //下
                     else if(y2 - y1 == 2){
                         if(chess.has((x1.toString()+(y1+1).toString()))){
                            res.status(500).send();
                            chess.clear();
                             return;                           
                         }
                         hasChess(pos1,pos2,x,y,x2.toString(),y2.toString(),move,res);
                     }
                     //左
                     else if(x1 - x2 == 2){
                         if(chess.has(((x1-1).toString()+y1.toString()))){
                            res.status(500).send();
                            chess.clear();
                             return;                           
                         }
                         hasChess(pos1,pos2,x,y,x2.toString(),y2.toString(),move,res);
                     }
                     //右
                     else if(x2 - x1 == 2){
                         if(chess.has(((x1+1).toString()+y1.toString()))){
                            res.status(500).send();
                            chess.clear();
                             return;                           
                         }
                         hasChess(pos1,pos2,x,y,x2.toString(),y2.toString(),move,res);
                     }
                 }
                 else {res.status(500).send();chess.clear(); return;}
                 break;
             case "相":
                 //是否按照田字行走
                 if(Math.abs(x1 - x2) == 2 && Math.abs(y1 - y2) == 2){
                     let halfX = (parseInt(x1) + parseInt(x2)) / 2;
                     let halfY = (parseInt(y1) + parseInt(y2)) / 2;
                     if(chess.has(halfX.toString()+halfY.toString())){
                        res.status(500).send();
                        chess.clear();
                         return;
                     }
                     if(name.substr(0,1)=="红"){
                         if(parseInt(y2)<5){res.status(500).send(); chess.clear();return;}
                     }
                     else{
                         if(parseInt(y2)>5){res.status(500).send(); chess.clear();return;}
                     }
                     hasChess(pos1,pos2,x,y,x2,y2,move,res);
                 }
                 else{res.status(500).send(); chess.clear();return;}
                 break;
             case "士":
                 if(Math.abs(x1 - x2) == 1 && Math.abs(y1 - y2) == 1){
                     let shi;
                     if(name.substr(0,1)=="红"){
                         shi = ["37","39","48","57","59"];
                         if(shi.indexOf(pos2) == -1){res.status(500).send();chess.clear(); return;}
                     }
                     else{
                         shi = ["30","32","41","50","52"];
                         if(shi.indexOf(pos2) == -1){res.status(500).send(); chess.clear();return;}
                     }
                     hasChess(pos1,pos2,x,y,x2,y2,move,res);
                 }
                 else{res.status(500).send(); chess.clear();return;}
                 break;
             case "帅":
                 if((Math.abs(x1 - x2) == 1 && y1 == y2)
                 || (Math.abs(y1 - y2) == 1 && x1 == x2)){
                     if(x2 < 3 || x2 > 5 || y2 < 7){res.status(500).send(); chess.clear();return;}
                     hasChess(pos1,pos2,x,y,x2,y2,move,res);
                 }
                 else{
                     if(chess.get(pos2)=="黑将"){
                         let max = Math.max(pos1,pos2);
                         let min = Math.min(pos1,pos2);
                         for(i = min+1;i < max; i+=1){
                             let p;
                             if(i<10) p = "0"+i;
                             else p = i.toString();
                             if(chess.has(p)){
                                res.status(500).send();
                                chess.clear();
                                 return;
                             }
                         }
                         x = modifyPos(x,x2+y2+"99");
                         y = modifyPos(x,move);
                         res.send(y);
                         chess.clear();
                         return;
                     }
                     else{res.status(500).send();chess.clear(); return;}
                 }
                 break;
             case "将":
                 if((Math.abs(x1 - x2) == 1 && y1 == y2)
                 || (Math.abs(y1 - y2) == 1 && x1 == x2)){
                     if(x2 < 3 || x2 > 5 || y2 > 2){res.status(500).send();chess.clear(); return;}
                     hasChess(pos1,pos2,x,y,x2,y2,move,res);
                 }
                 else{
                     if(chess.get(pos2)=="红帅"){
                         let max = Math.max(pos1,pos2);
                         let min = Math.min(pos1,pos2);
                         for(i = min+1;i < max; i+=1){
                             let p;
                             if(i<10) p = "0"+i;
                             else p = i.toString();
                             if(chess.has(p)){
                                res.status(500).send();
                                chess.clear();
                                 return;
                             }
                         }
                         x = modifyPos(x,x2+y2+"99");
                         y = modifyPos(x,move);
                         res.json(y);
                         chess.clear();
                         return;
                     }
                     else{res.status(500).send();chess.clear(); return;}
                 }
                 break;
             case "兵":
                 if((Math.abs(x1 - x2) == 1 && y1 == y2)
                 || (Math.abs(y1 - y2) == 1 && x1 == x2)){
                     if(y1 >= 5){
                        if(x1==x2 && y2<y1){
                         hasChess(pos1,pos2,x,y,x2,y2,move,res);
                         return;
                        }
                        res.status(500).send();
                        chess.clear();
                     }
                     else{
                         if(y2 >=5 ){res.status(500).send(); chess.clear();return;}
                         if(y2 > y1 ){res.status(500).send(); chess.clear();return;}
                         hasChess(pos1,pos2,x,y,x2,y2,move,res);
                     }
                 }
                 else{res.status(500).send();chess.clear(); return;}
                 break;
             case "卒":
                 if((Math.abs(x1 - x2) == 1 && y1 == y2)
                 || (Math.abs(y1 - y2) == 1 && x1 == x2)){
                     if(y1 < 5){
                        if(x1==x2 && y2>y1){
                         hasChess(pos1,pos2,x,y,x2,y2,move,res);
                         return;
                        }
                        res.status(500).send();
                        chess.clear();
                     }
                     else{
                         if(y2 <5 ){res.status(500).send();chess.clear(); return;}
                         if(y2 < y1 ){res.status(500).send(); chess.clear();return;}
                         hasChess(pos1,pos2,x,y,x2,y2,move,res);
                     }
                 }
                 else{res.status(500).send(); chess.clear();return;}
                 break;
             case "炮":
                 //是否直线
                 if(x2 == x1 || y2 == y1){
                     let min = Math.min(parseInt(pos1),parseInt(pos2));
                     let max = Math.max(parseInt(pos1),parseInt(pos2));
                     //上下
                    if(x2 == x1){
                         for(i = min+1;i < max; i+=1){
                             let p;
                             if(i<10) p = "0"+i;
                             else p = i.toString();
                             if(chess.has(p)){
                                 for(j = i+1;j < max; j+=1){
                                     let k;
                                     if(j<10) k = "0"+j;
                                     else k = j.toString();
                                     if(chess.has(k)){
                                        res.status(500).send();
                                        chess.clear();
                                         return;
                                     }
                                 }
                                 if(chess.has(pos2)){
                                     if(chess.get(pos2).substr(0,1) == chess.get(pos1).substr(0,1)){
                                        res.status(500).send();
                                        chess.clear();
                                         return;
                                     }
                                     else{
                                         x = modifyPos(x,x2+y2+"99");
                                         y = modifyPos(x,move);
                                         res.json(y);
                                         chess.clear();
                                         return;
                                     }
                                 }
                                 res.status(500).send();
                                 chess.clear();
                                 return;
                             }
                         }
                         if(chess.has(pos2)){
                            res.status(500).send();
                            chess.clear();
                             return;
                         }
                         else{
                             y = modifyPos(x,move);
                             res.json(y);
                             chess.clear();
                             return;
                         }             
                    }
                    //左右
                    else{
                         for(i = min+10;i < max; i+=10){
                             if(chess.has(i.toString())){
                                 for(j = i+10;j < max; j+=10){
                                     if(chess.has(j.toString())){
                                        res.status(500).send();
                                        chess.clear();
                                         return;
                                     }
                                 }
                                 if(chess.has(pos2)){
                                     if(chess.get(pos2).substr(0,1) == chess.get(pos1).substr(0,1)){
                                        res.status(500).send();
                                        chess.clear();
                                         return;
                                     }
                                     else{
                                         x = modifyPos(x,x2+y2+"99");
                                         y = modifyPos(x,move);
                                         res.json(y);
                                         chess.clear();
                                         return;
                                     }
                                 }
                                 res.status(500).send();
                                 chess.clear();
                                 return;
                             }
                         }
                         if(chess.has(pos2)){
                            res.status(500).send();
                            chess.clear();
                             return;
                         }
                         else{
                             y = modifyPos(x,move);
                             res.json(y);
                             chess.clear();
                             return;
                         }  
                    }
                 }
                 else {res.status(500).send();chess.clear(); return;}
                 break;
         }
     }
     else{res.status(500).send();chess.clear();}
})

/*
测试函数
*/
//测试1个
app.get('/testone',(req,res)=>{
    let x = req.query.x;
    Chess.destroy({where:{}}).then(()=>{
        res.status(202);
    })
    // Chess.findOne({Where:{init:x}}).then(chess=>{
    //     res.send(chess);
    // })
})
//测试
app.get('/test',(req,res)=>{
    Chess.findAll().then(chess=>{
        // console.log(chess[0].after);
        console.log(chess.length);
        if(chess)res.send(chess);
        else res.status(500);
        
    })
})

/*
工具函数
 */

//将棋子位置与名称存入map中
function sliceChess(x){
    for(i = 0;i < 32; i+=1){
        chess.set(x.substr(i*2,2),chessName[i]);
    }

    //console.log(chess);
}

//修改棋子位置
function modifyPos(x,move){
    for(i = 0;i < 64; i+=2){
        if(x.substr(i,2) == move.substr(0,2)){
            let y;
            if(i==0){
                y = move.slice(2,4)+x.substr(2,x.length);
            }
            else{
                y = x.slice(0,i)+move.slice(2,4)+x.substr(i+2,x.length);
            }
            return y;
        }
    }
}

//当落子位置有棋子时
function hasChess(pos1,pos2,x,y,x2,y2,move,res){
    if(chess.has(pos2)){
        if(chess.get(pos2).substr(0,1) == chess.get(pos1).substr(0,1)){
            res.status(500).send();
            chess.clear();
            return;
        }
        else{
            x = modifyPos(x,x2+y2+"99");
            y = modifyPos(x,move);
            res.json(y).status(200);
            chess.clear();
            return;
        }
    }
    else{
        y = modifyPos(x,move);
        res.json(y).status(200);
        chess.clear();
        return;
    }
}


app.listen(5000,()=> console.log('启动在http://localhost:5000/') );


