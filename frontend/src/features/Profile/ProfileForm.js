
import React, { useState } from "react";
import './ProfileForm.css';

function ProfileForm(props) {

    const [fullName, setFullName] = useState("");

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

            <button className="btn-primary" >
                Save Profile
            </button>

        </div>
    )
}

export default ProfileForm
