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


const Trainings = () => {

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


  const [
    search,
    setSearch
  ] = useState("");


  const [
    category,
    setCategory
  ] = useState("ALL");


  // =====================================================
  // LOAD TRAININGS
  // =====================================================

  const loadTrainings =
    async () => {

      try {

        setLoading(true);

        setError("");


        const response =
          await API.get(
            "/trainings"
          );


        setTrainings(
          response.data.trainings ||
          []
        );

      } catch (err) {

        console.error(
          "Training loading error:",
          err
        );


        setError(
          err.response?.data?.message ||
          "Failed to load trainings"
        );

      } finally {

        setLoading(false);

      }

    };


  useEffect(() => {

    if (user) {
      loadTrainings();
    }

  }, [user]);


  // =====================================================
  // CATEGORIES
  // =====================================================

  const categories =
    useMemo(() => {

      const values =
        trainings
          .map(
            training =>
              training.category
          )
          .filter(Boolean);


      return [
        ...new Set(values)
      ];

    }, [trainings]);


  // =====================================================
  // FILTER
  // =====================================================

  const filteredTrainings =
    useMemo(() => {

      const searchValue =
        search
          .toLowerCase()
          .trim();


      return trainings.filter(
        training => {

          const matchesSearch =
            !searchValue ||
            training.title
              ?.toLowerCase()
              .includes(
                searchValue
              ) ||
            training.description
              ?.toLowerCase()
              .includes(
                searchValue
              );


          const matchesCategory =
            category === "ALL" ||
            training.category ===
              category;


          return (
            matchesSearch &&
            matchesCategory
          );

        }
      );

    }, [
      trainings,
      search,
      category
    ]);


  // =====================================================
  // STATISTICS
  // =====================================================

  const total =
    trainings.length;


  const completed =
    trainings.filter(
      training =>
        training.progress?.completed
    ).length;


  const pending =
    total - completed;


  const percentage =
    total > 0
      ? Math.round(
          (completed / total) *
          100
        )
      : 0;


  // =====================================================
  // OPEN TRAINING
  // =====================================================

  const openTraining =
    (trainingId) => {

      navigate(
        `/training/${trainingId}`
      );

    };


  return (

    <div className="employee-training-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="employee-training-header">

        <div>

          <span className="page-eyebrow">
            LEARNING PORTAL
          </span>

          <h1>
            Training Library
          </h1>

          <p>
            Learn, complete and track
            your department training.
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


      {/* =================================================
          PROGRESS SUMMARY
      ================================================= */}

      <div className="training-summary-grid">

        <div className="training-summary-card">

          <div className="summary-icon">
            🎓
          </div>

          <div>

            <span>
              Total Training
            </span>

            <strong>
              {total}
            </strong>

          </div>

        </div>


        <div className="training-summary-card">

          <div className="summary-icon">
            ✅
          </div>

          <div>

            <span>
              Completed
            </span>

            <strong>
              {completed}
            </strong>

          </div>

        </div>


        <div className="training-summary-card">

          <div className="summary-icon">
            ⏳
          </div>

          <div>

            <span>
              Pending
            </span>

            <strong>
              {pending}
            </strong>

          </div>

        </div>


        <div className="training-summary-card">

          <div className="summary-icon">
            📊
          </div>

          <div>

            <span>
              Completion
            </span>

            <strong>
              {percentage}%
            </strong>

          </div>

        </div>

      </div>


      {/* =================================================
          FILTERS
      ================================================= */}

      <div className="training-filter-bar">

        <div className="training-search">

          <span>
            🔎
          </span>

          <input
            type="text"
            placeholder="Search training..."
            value={search}
            onChange={e =>
              setSearch(
                e.target.value
              )
            }
          />

        </div>


        <select
          value={category}
          onChange={e =>
            setCategory(
              e.target.value
            )
          }
        >

          <option value="ALL">
            All Categories
          </option>


          {categories.map(
            item => (

              <option
                key={item}
                value={item}
              >
                {item}
              </option>

            )
          )}

        </select>

      </div>


      {/* =================================================
          ERROR
      ================================================= */}

      {error && (

        <div className="alert alert-error">
          {error}
        </div>

      )}


      {/* =================================================
          LOADING
      ================================================= */}

      {loading ? (

        <div className="employee-training-loading">

          <div className="loading-spinner"></div>

          <p>
            Loading training library...
          </p>

        </div>

      ) : filteredTrainings.length === 0 ? (

        <div className="employee-training-empty">

          <div>
            🎥
          </div>

          <h3>
            No training available
          </h3>

          <p>
            There are no training videos
            available for your department.
          </p>

        </div>

      ) : (

        <div className="employee-training-grid">

          {filteredTrainings.map(
            training => {

              const isCompleted =
  training.progress?.completed;

const watchedSeconds =
  Number(training.progress?.watchedSeconds || 0);

const durationSeconds =
  Number(training.durationSeconds || 0);

const progressPercentage =
  isCompleted
    ? 100
    : durationSeconds > 0
    ? Math.min(
        100,
        Math.round(
          (watchedSeconds / durationSeconds) * 100
        )
      )
    : watchedSeconds > 0
    ? 15
    : 0;


              return (

                <div
                  className="employee-training-card"
                  key={
                    training._id
                  }
                >

                  {/* ==================================
                      VIDEO THUMBNAIL
                  ================================== */}

                  <div
                    className="employee-training-thumbnail"
                    onClick={() =>
                      openTraining(
                        training._id
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


                    {isCompleted && (

                      <div className="completed-badge">

                        ✓ Completed

                      </div>

                    )}

                  </div>


                  {/* ==================================
                      CARD BODY
                  ================================== */}

                  <div className="employee-training-card-body">

                    <h3>
                      {
                        training.title
                      }
                    </h3>


                    <p>

                      {
                        training.description ||
                        "Training video"
                      }

                    </p>


                    {/* =================================
                        PROGRESS
                    ================================= */}

                    <div className="training-progress-area">

  <div className="training-progress-info">

    <span>
      {isCompleted
        ? "Completed"
        : progressPercentage > 0
        ? "In Progress"
        : "Not Started"}
    </span>

    <span>
      {progressPercentage}%
    </span>

  </div>

  <div className="training-progress-track">

    <div
      className={
        isCompleted
          ? "training-progress-fill completed"
          : progressPercentage > 0
          ? "training-progress-fill started"
          : "training-progress-fill"
      }
      style={{
        width: `${progressPercentage}%`
      }}
    />

  </div>

</div>


                    {/* =================================
                        ACTION
                    ================================= */}

                    <button
                      className={
                        isCompleted
                          ? "training-completed-button"
                          : "training-start-button"
                      }
                      onClick={() =>
                        openTraining(
                          training._id
                        )
                      }
                    >

                      {isCompleted
                        ? "Restart Training"
                        : watchedSeconds > 0
                        ? "Continue Training"
                        : "Start Training"}

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


export default Trainings;