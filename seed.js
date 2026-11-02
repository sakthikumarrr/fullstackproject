require("dotenv").config();
const mongoose = require("mongoose"), bcrypt = require("bcryptjs");
const User = require("./models/User"), Assessment = require("./models/Assessment"), CodingProblem = require("./models/CodingProblem"), Company = require("./models/Company"), JobPosting = require("./models/JobPosting"), StudentProfile = require("./models/StudentProfile"), MockInterview = require("./models/MockInterview");
(async()=>{
 await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/pathway_placement");
 await Promise.all([User.deleteMany({}),Assessment.deleteMany({}),CodingProblem.deleteMany({}),Company.deleteMany({}),JobPosting.deleteMany({}),StudentProfile.deleteMany({}),MockInterview.deleteMany({})]);
 const pass=await bcrypt.hash("Pathway@123",12);
 const admin=await User.create({name:"Launchly Admin",email:"admin@pathway.dev",password:pass,role:"admin"});
 const students=await User.insertMany(Array.from({length:10},(_,i)=>({name:`Student ${i+1}`,email:`student${i+1}@pathway.dev`,password:pass,role:"student"})));
 await StudentProfile.insertMany(students.map((u,i)=>({user:u._id,college:"VIT",degree:"B.Sc Computer Science",branch:"Computer Science",graduationYear:2027,cgpa:7.2+(i%3)*.5,skills:["Java","Python","SQL"].slice(0,2+i%2)})));
 const topics=["Quantitative Aptitude","Logical Reasoning","Verbal Ability","Data Interpretation"];
 const qs=[
  ["What is 20% of 250?",["25","40","50","60"],2,"20% means 0.2 × 250 = 50."],
  ["If a train travels 120 km in 2 hours, its speed is?",["40 km/h","50 km/h","60 km/h","80 km/h"],2,"Speed = distance ÷ time = 60 km/h."],
  ["Find the next number: 2, 4, 8, 16, ?",["18","24","30","32"],3,"Each term is multiplied by 2."],
  ["Choose the synonym of 'Rapid'.",["Slow","Quick","Weak","Late"],1,"Rapid means quick or fast."],
  ["A shop gives 10% discount on ₹500. Sale price?",["₹400","₹450","₹475","₹490"],1,"Discount is ₹50, so price is ₹450."]
 ];
 const questions=Array.from({length:20},(_,i)=>{const q=qs[i%qs.length];return {prompt:q[0],options:q[1],answerIndex:q[2],explanation:q[3],topic:topics[i%4],points:1};});
 await Assessment.create([
  {title:"Placement Aptitude Starter",category:"aptitude",topic:"Mixed Aptitude",durationMinutes:20,questions,published:true,createdBy:admin._id},
  {title:"Technical Fundamentals",category:"technical",topic:"Programming & CS",durationMinutes:20,questions:questions.map((q,i)=>({...q,prompt:["Which data structure uses FIFO?","Which language runs on the JVM?","Which SQL command retrieves records?","What does CPU stand for?","Which OOP concept hides internal details?"][i%5],options:[["Stack","Queue","Tree","Graph"],["Python","Java","C","HTML"],["INSERT","UPDATE","SELECT","DELETE"],["Central Processing Unit","Computer Personal Unit","Control Program Unit","Central Process Utility"],["Inheritance","Polymorphism","Encapsulation","Compilation"]][i%5],answerIndex:[1,1,2,0,2][i%5]})),published:true,createdBy:admin._id},
  {title:"TCS Company Practice",category:"company",topic:"TCS",company:"TCS",durationMinutes:15,questions:questions.slice(0,10),published:true,createdBy:admin._id}
 ]);
 await CodingProblem.insertMany(Array.from({length:15},(_,i)=>({title:["Two Sum","Reverse a String","Palindrome Check","Find Maximum","FizzBuzz"][i%5]+(i>4?` ${Math.floor(i/5)+1}`:""),slug:`practice-problem-${i+1}`,statement:"Write a program to solve the given problem. Read input from standard input and print the required output.",inputFormat:"A single line containing the input value.",outputFormat:"Print the computed result.",examples:[{input:"5",output:"5"}],difficulty:["Easy","Medium","Hard"][i%3],topics:["Arrays","Strings","Logic"][i%3]})));
 const companies=await Company.insertMany(["TCS","Infosys","Wipro","Accenture","Cognizant"].map(name=>({name,industry:"Information Technology",location:"India"})));
 await JobPosting.insertMany(companies.map((c,i)=>({company:c._id,recruiter:admin._id,title:["Graduate Engineer Trainee","Software Developer","Associate Engineer","Analyst","Junior Developer"][i],description:"Entry-level opportunity for graduates with programming and problem-solving skills.",location:"India",type:"Full-time",minCgpa:6.5,skills:["Java","SQL"],active:true})));
 await MockInterview.create([{title:"HR Fundamentals Practice",type:"HR",questions:[{prompt:"Tell me about yourself."},{prompt:"What are your strengths?"},{prompt:"Why should we hire you?"}]},{title:"Technical Interview Practice",type:"Technical",questions:[{prompt:"Explain OOP principles."},{prompt:"What is the difference between SQL and NoSQL?"}]}]);
 console.log("Launchly seed complete. Demo password for all accounts: Pathway@123"); console.log("Admin: admin@pathway.dev"); console.log("Student: student1@pathway.dev"); await mongoose.disconnect();
})().catch(e=>{console.error(e);process.exit(1)});
