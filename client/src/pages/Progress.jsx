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


const Progress = () => {

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


  // ==========================================
  // LOAD TRAININGS
  // ==========================================

  const loadProgress = async () => {

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
        "Progress loading error:",
        err
      );

      setError(
        err.response?.data?.message ||
        "Failed to load progress"
      );

    } finally {

      setLoading(false);

    }

  };


  useEffect(() => {

    if (user) {
      loadProgress();
    }

  }, [user]);


  // ==========================================
  // ONLY IN-PROGRESS TRAININGS
  // ==========================================

  const progressTrainings =
    useMemo(() => {

      return trainings.filter(
        training => {

          const progress =
            training.progress;

          if (!progress) {
            return false;
          }

          if (
            progress.completed
          ) {
            return false;
          }

          return (
            Number(
              progress.watchedSeconds || 0
            ) > 0
          );

        }
      );

    }, [trainings]);


  // ==========================================
  // TOTAL PROGRESS
  // ==========================================

  const averageProgress =
    progressTrainings.length > 0
      ? Math.round(
          progressTrainings.reduce(
            (sum, training) => {

              const watched =
                Number(
                  training.progress
                    ?.watchedSeconds || 0
                );

              const duration =
                Number(
                  training.durationSeconds || 0
                );

              if (
                duration <= 0
              ) {
                return sum;
              }

              const percentage =
                Math.min(
                  100,
                  Math.round(
                    (watched / duration) *
                    100
                  )
                );

              return sum + percentage;

            },
            0
          ) /
          progressTrainings.length
        )
      : 0;


  // ==========================================
  // DURATION
  // ==========================================

  const formatDuration =
    (seconds = 0) => {

      const value =
        Math.floor(
          Number(seconds) || 0
        );

      const minutes =
        Math.floor(
          value / 60
        );

      const remaining =
        value % 60;

      if (minutes === 0) {
        return `${remaining}s`;
      }

      return `${minutes}m ${remaining}s`;

    };


  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {

    return (
      <div className="employee-training-loading">

        <div className="loading-spinner"></div>

        <p>
          Loading your progress...
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
            My Progress
          </h1>

          <p>
            Continue the training videos
            you have already started.
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
            ▶️
          </div>

          <div>

            <span>
              In Progress
            </span>

            <strong>
              {progressTrainings.length}
            </strong>

          </div>

        </div>


        <div className="training-summary-card">

          <div className="summary-icon">
            📊
          </div>

          <div>

            <span>
              Average Progress
            </span>

            <strong>
              {averageProgress}%
            </strong>

          </div>

        </div>

      </div>


      {/* ERROR */}

      {error && (

        <div className="alert alert-error">
          {error}
        </div>

      )}


      {/* EMPTY */}

      {progressTrainings.length === 0 ? (

        <div className="employee-training-empty">

          <div>
            📚
          </div>

          <h3>
            No training in progress
          </h3>

          <p>
            Start a training video and
            your progress will appear here.
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

          {progressTrainings.map(
            training => {

              const watchedSeconds =
                Number(
                  training.progress
                    ?.watchedSeconds || 0
                );

              const durationSeconds =
                Number(
                  training.durationSeconds || 0
                );

              const percentage =
                durationSeconds > 0
                  ? Math.min(
                      100,
                      Math.round(
                        (
                          watchedSeconds /
                          durationSeconds
                        ) *
                        100
                      )
                    )
                  : 15;

              return (

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
                        ▶
                      </span>

                    </div>

                    <div className="thumbnail-category">

                      {
                        training.category ||
                        "General"
                      }

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
                          In Progress
                        </span>

                        <span>
                          {percentage}%
                        </span>

                      </div>


                      <div className="training-progress-track">

                        <div
                          className="training-progress-fill started"
                          style={{
                            width:
                              `${percentage}%`
                          }}
                        />

                      </div>

                    </div>


                    <div
                      style={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                        marginTop: "8px",
                        fontSize: "13px",
                        color: "#666"
                      }}
                    >

                      <span>
                        Watched:{" "}
                        {formatDuration(
                          watchedSeconds
                        )}
                      </span>

                      <span>
                        Total:{" "}
                        {formatDuration(
                          durationSeconds
                        )}
                      </span>

                    </div>


                    <button
                      className="training-start-button"
                      onClick={() =>
                        navigate(
                          `/training/${training._id}`
                        )
                      }
                    >
                      Continue Training
                    </button>

                  </div>

                </div>

              );

            }
          )}

        </div>

      )}

    </div>

  );

};


export default Progress;