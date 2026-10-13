import {
  useEffect,
  useMemo,
  useState
} from "react";

import {
  useNavigate
} from "react-router-dom";

import API from "../services/api";

import {
  useAuth
} from "../context/AuthContext";


const Completed = () => {

  const {
    user
  } = useAuth();

  const navigate =
    useNavigate();


  const [
    trainings,
    setTrainings
  ] = useState([]);


  const [
    loading,
    setLoading
  ] = useState(true);


  const [
    error,
    setError
  ] = useState("");


  const loadCompleted =
    async () => {

      try {

        setLoading(true);
        setError("");

        const response =
          await API.get("/trainings");

        const list =
          Array.isArray(
            response.data?.trainings
          )
            ? response.data.trainings
            : [];

        setTrainings(list);

      } catch (err) {

        console.error(
          "Completed loading error:",
          err
        );

        setError(
          err.response?.data?.message ||
          "Failed to load completed trainings"
        );

      } finally {

        setLoading(false);

      }

    };


  useEffect(() => {

    if (user) {
      loadCompleted();
    }

  }, [user]);


  const completedTrainings =
    useMemo(() => {

      return trainings.filter(
        training =>
          training.progress?.completed === true
      );

    }, [trainings]);


  if (loading) {

    return (

      <div className="employee-training-loading">

        <div className="loading-spinner"></div>

        <p>
          Loading completed trainings...
        </p>

      </div>

    );

  }


  return (

    <div className="employee-training-page">

      {/* HEADER */}

      <div className="employee-training-header">

        <div>

          <span className="page-eyebrow">
            LEARNING PORTAL
          </span>

          <h1>
            Completed Training
          </h1>

          <p>
            Review all training videos
            you have completed.
          </p>

        </div>

        <div className="employee-department-badge">

          <span>
            Department
          </span>

          <strong>
            {
              user?.department?.name ||
              "No Department"
            }
          </strong>

        </div>

      </div>


      {/* SUMMARY */}

      <div className="training-summary-grid">

        <div className="training-summary-card">

          <div className="summary-icon">
            ✅
          </div>

          <div>

            <span>
              Completed Training
            </span>

            <strong>
              {completedTrainings.length}
            </strong>

          </div>

        </div>

      </div>


      {error && (

        <div className="alert alert-error">
          {error}
        </div>

      )}


      {/* EMPTY */}

      {completedTrainings.length === 0 ? (

        <div className="employee-training-empty">

          <div>
            🎓
          </div>

          <h3>
            No completed training
          </h3>

          <p>
            Complete a training video
            and it will appear here.
          </p>

          <button
            className="training-start-button"
            onClick={() =>
              navigate("/trainings")
            }
          >
            Browse Trainings
          </button>

        </div>

      ) : (

        <div className="employee-training-grid">

          {completedTrainings.map(
            training => (

              <div
                className="employee-training-card"
                key={training._id}
              >

                <div
                  className="employee-training-thumbnail"
                  onClick={() =>
                    navigate(
                      `/training/${training._id}`
                    )
                  }
                >

                  <div className="thumbnail-placeholder">

                    <span>
                      ✓
                    </span>

                  </div>


                  <div className="thumbnail-category">

                    {
                      training.category ||
                      "General"
                    }

                  </div>


                  <div className="completed-badge">

                    ✓ Completed

                  </div>

                </div>


                <div className="employee-training-card-body">

                  <h3>
                    {training.title}
                  </h3>

                  <p>
                    {
                      training.description ||
                      "Training video"
                    }
                  </p>


                  <div className="training-progress-area">

                    <div className="training-progress-info">

                      <span>
                        Completed
                      </span>

                      <span>
                        100%
                      </span>

                    </div>


                    <div className="training-progress-track">

                      <div
                        className="training-progress-fill completed"
                        style={{
                          width: "100%"
                        }}
                      />

                    </div>

                  </div>


                  <button
                    className="training-completed-button"
                    onClick={() =>
                      navigate(
                        `/training/${training._id}`
                      )
                    }
                  >
                    Restart Training
                  </button>

                </div>

              </div>

            )
          )}

        </div>

      )}

    </div>

  );

};


export default Completed;