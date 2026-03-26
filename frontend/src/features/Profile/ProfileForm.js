
import React, { useState } from "react";
import './ProfileForm.css';

function ProfileForm(props) {

    const [fullName, setFullName] = useState("Luutu Gregory Valentino");
    const [studentID, setStudentID] = useState("25/U/0347");
    const [regNum, setRegNum] = useState("2500700347");
    const [course, setCourse] = useState("Bachelor of Science in Computer Science");
    const [year, setYear] = useState('Year 1');
    const [semester, setSesmster] = useState("")

    const handleSave = (e) =>{
        e.preventDefault();

        const studentData= {
            fullName: fullName,
            studentID :studentID,
            regNum : regNum,
            course:course,
            year:year,
            semester:semester,
            updatedAt: new Date().toISOString()
        };
        console.log("READY FOR DATABASE: ",studentData);
        alert("Profile Saved Successfully(testing!)")
        
    }

    return (
        <div className="auth-card">
            <h2> Complete your Profile</h2>

            <div className="input-group">
                <label htmlFor="full-name">Full Name</label>
                <input
                    id="full-name"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter you official name"
                />
            </div>

            <div className="input-group">
                <label htmlFor="student-id">Student ID</label>
                <input
                    id="student-id"
                    type="text"
                    value={studentID}
                    onChange={e => setStudentID(e.target.value)}
                    placeholder="25/U/0001"
                    readOnly={false}
                />
            </div>

            <div className="input-group">
                <label htmlFor="Registration-Number">Registration Number</label>
                <input
                    id="Registration-Number"
                    typeof="text"
                    value={regNum}
                    placeholder="25000U000000"
                    onChange={e => setRegNum(e.target.value)}
                    readOnly={false}
                />
            </div>

            <div className="input-group">
                <label for="course">Course</label>
                <select
                    id="course"
                    value={course}
                    onChange={e => setCourse(e.target.value)}
                >
                    <option value="">Please choose a course</option>
                    <option value="BCSC">Bacheor of Science in COmputer Science</option>
                    <option value="BIST">Bachelor of scciene in Information Systems</option>
                    <option value="BSSE">Bachelor of Science in Software Engineering</option>
                </select>
            </div>

            <div className="input-group">
                <label for="Year-of-Study">Year of Study</label>
                <select
                    id="Year-of-Study"
                    onChange={e => setYear(e.target.value)}
                    value={year}
                >
                    <option value="">Please choose a Year</option>
                    <option value="1">Year 1</option>
                    <option value="2">Year 2</option>
                    <option value="3">Year 3</option>
                    <option value="4">Year 4</option>
                </select>
            </div>

            <div className="input-group">
                <label for="Semester">Semester</label>
                <select
                    id="Semester"
                    onChange={e => setSesmster(e.target.value)}
                    value={semester}
                ><option value="">Please choose a semester</option>
                    <option value="Sem1">Semester 1</option>
                    <option value="Sem2">Semester 2</option>
                </select>
            </div>

            <button 
            className="btn-primary"
            onClick={handleSave}
             >
                Save Profile
            </button>

        </div>
    )
}

export default ProfileForm


