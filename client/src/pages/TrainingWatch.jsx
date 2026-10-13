import {
  useEffect,
  useRef,
  useState
} from "react";

import {
  useAuth
} from "../context/AuthContext";

import {
  useNavigate,
  useParams
} from "react-router-dom";

import API, {
  serverUrl
} from "../services/api";


const TrainingWatch = () => {

  // =================================================
  // AUTH
  // =================================================

  const { user } = useAuth();


  // =================================================
  // ROUTER
  // =================================================

  const { id } = useParams();

  const navigate = useNavigate();


  // =================================================
  // REFS
  // =================================================

  const videoRef = useRef(null);

  const saveTimerRef = useRef(null);


  // =================================================
  // STATE
  // =================================================

  const [
    training,
    setTraining
  ] = useState(null);

  const [
    progress,
    setProgress
  ] = useState({
    watchedSeconds: 0,
    completed: false
  });

  const [
    loading,
    setLoading
  ] = useState(true);

  const [
    saving,
    setSaving
  ] = useState(false);

  const [
    error,
    setError
  ] = useState("");

  const [
    message,
    setMessage
  ] = useState("");


  // =================================================
  // ROLE
  // =================================================

  const isUser =
    user?.role === "USER";


  // =================================================
  // LOAD TRAINING
  // =================================================

  useEffect(() => {

    loadTraining();

    return () => {

      if (saveTimerRef.current) {

        clearTimeout(
          saveTimerRef.current
        );

        saveTimerRef.current = null;

      }

    };

  }, [id]);


  // =================================================
  // LOAD TRAINING FUNCTION
  // =================================================

  const loadTraining = async () => {

    try {

      setLoading(true);

      setError("");


      const response =
        await API.get(
          `/trainings/${id}`
        );


      const trainingData =
        response.data?.training;

      if (!trainingData) {

        throw new Error(
          "Training data not found"
        );

      }


      setTraining(
        trainingData
      );


      // Only USER has progress tracking.
      if (isUser) {

        setProgress({

          watchedSeconds:
            Number(
              response.data?.progress
                ?.watchedSeconds || 0
            ),

          completed:
            Boolean(
              response.data?.progress
                ?.completed
            )

        });

      } else {

        setProgress({

          watchedSeconds: 0,

          completed: false

        });

      }

    } catch (err) {

      console.error(
        "Load training error:",
        err
      );


      setError(
        err.response?.data?.message ||
        err.message ||
        "Failed to load training"
      );

    } finally {

      setLoading(false);

    }

  };


  // =================================================
  // SAVE PROGRESS
  // =================================================

  const saveProgress = async (
    watchedSeconds,
    completed = false
  ) => {

    // ADMIN / HOD preview mode
    // should NOT create progress records.
    if (!isUser) {
      return;
    }


    try {

      setSaving(true);


      const safeSeconds =
        Math.max(
          0,
          Math.floor(
            Number(
              watchedSeconds
            ) || 0
          )
        );


      const response =
        await API.post(
          `/trainings/${id}/progress`,
          {
            watchedSeconds:
              safeSeconds,

            completed:
              Boolean(completed)
          }
        );


      const savedProgress =
        response.data?.progress;


      setProgress({

        watchedSeconds:
          Number(
            savedProgress?.watchedSeconds ??
            safeSeconds
          ),

        completed:
          Boolean(
            savedProgress?.completed ??
            completed
          )

      });

    } catch (err) {

      console.error(
        "Progress save error:",
        err
      );

    } finally {

      setSaving(false);

    }

  };


  // =================================================
  // VIDEO LOADED
  // =================================================

  const handleLoadedMetadata = () => {

    const video =
      videoRef.current;


    if (!video) {
      return;
    }


    // Admin/HOD preview starts from beginning.
    if (!isUser) {
      return;
    }


    if (progress.completed) {
      return;
    }


    if (
      progress.watchedSeconds <= 0
    ) {

      return;

    }


    try {

      const duration =
        video.duration;


      if (
        !Number.isFinite(duration)
      ) {

        return;

      }


      if (
        progress.watchedSeconds <
        duration - 5
      ) {

        video.currentTime =
          progress.watchedSeconds;

      }

    } catch (err) {

      console.error(
        "Seek error:",
        err
      );

    }

  };


  // =================================================
  // PLAY
  // =================================================

  const handlePlay = () => {

    setMessage("");

  };


  // =================================================
  // PAUSE
  // =================================================

  const handlePause = () => {

    if (!isUser) {
      return;
    }


    const video =
      videoRef.current;


    if (!video) {
      return;
    }


    saveProgress(
      video.currentTime,
      progress.completed
    );

  };


  // =================================================
  // TIME UPDATE
  // =================================================

  const handleTimeUpdate = () => {

    if (!isUser) {
      return;
    }


    const video =
      videoRef.current;


    if (!video) {
      return;
    }


    if (
      progress.completed
    ) {

      return;

    }


    if (
      saveTimerRef.current
    ) {

      return;

    }


    const currentTime =
      video.currentTime;


    saveTimerRef.current =
      setTimeout(
        async () => {

          saveTimerRef.current =
            null;


          await saveProgress(
            currentTime,
            false
          );

        },
        10000
      );

  };


  // =================================================
  // VIDEO ENDED
  // =================================================

  const handleEnded = async () => {

    if (!isUser) {

      setMessage(
        "Preview finished."
      );

      return;

    }


    const video =
      videoRef.current;


    if (!video) {
      return;
    }


    if (
      saveTimerRef.current
    ) {

      clearTimeout(
        saveTimerRef.current
      );

      saveTimerRef.current =
        null;

    }


    await saveProgress(
      video.duration || 0,
      true
    );


    setMessage(
      "Training completed successfully! 🎉"
    );

  };


  // =================================================
  // MANUAL COMPLETE
  // =================================================

  const markComplete = async () => {

    if (!isUser) {
      return;
    }


    const video =
      videoRef.current;


    const currentTime =
      video
        ? video.currentTime
        : progress.watchedSeconds;


    await saveProgress(
      currentTime,
      true
    );


    setMessage(
      "Training marked as completed! ✓"
    );

  };


  // =================================================
  // BACK
  // =================================================

  const goBack = () => {

    navigate(
      "/trainings"
    );

  };


  // =================================================
  // FORMAT DURATION
  // =================================================

  const formatDuration = (
    seconds = 0
  ) => {

    const totalSeconds =
      Math.floor(
        Number(seconds) || 0
      );


    const hours =
      Math.floor(
        totalSeconds / 3600
      );


    const minutes =
      Math.floor(
        (totalSeconds % 3600) / 60
      );


    const remainingSeconds =
      totalSeconds % 60;


    if (hours > 0) {

      return `${hours}h ${minutes}m ${remainingSeconds}s`;

    }


    if (minutes > 0) {

      return `${minutes}m ${remainingSeconds}s`;

    }


    return `${remainingSeconds}s`;

  };


  // =================================================
  // PROGRESS %
  // =================================================

  const progressPercentage =
    progress.completed
      ? 100
      : training?.durationSeconds > 0
      ? Math.min(
          100,
          Math.round(
            (
              progress.watchedSeconds /
              training.durationSeconds
            ) * 100
          )
        )
      : progress.watchedSeconds > 0
      ? 15
      : 0;


  // =================================================
  // LOADING
  // =================================================

  if (loading) {

    return (

      <div className="watch-page-loading">

        <div className="loading-spinner"></div>

        <p>
          Loading training...
        </p>

      </div>

    );

  }


  // =================================================
  // ERROR
  // =================================================

  if (error) {

    return (

      <div className="watch-page-error">

        <div className="error-icon">
          ⚠️
        </div>

        <h2>
          Unable to load training
        </h2>

        <p>
          {error}
        </p>

        <button
          className="primary-button"
          onClick={goBack}
        >
          Back to Trainings
        </button>

      </div>

    );

  }


  if (!training) {
    return null;
  }


  // =================================================
  // RENDER
  // =================================================

  return (

    <div className="watch-training-page">


      {/* =================================================
          TOP BAR
      ================================================= */}

      <div className="watch-top-bar">

        <button
          className="back-training-button"
          onClick={goBack}
        >
          ← Back to Trainings
        </button>


        <span>

          {!isUser

            ? "Preview Mode"

            : saving

            ? "Saving progress..."

            : progress.completed

            ? "✓ Training Completed"

            : "Progress automatically saved"}

        </span>

      </div>


      {/* =================================================
          VIDEO
      ================================================= */}

      <div className="watch-video-section">

        <video
          ref={videoRef}
          className="main-training-video"
          controls
          controlsList="nodownload"
          src={
            serverUrl(
              training.videoUrl
            )
          }
          onLoadedMetadata={
            handleLoadedMetadata
          }
          onPlay={
            handlePlay
          }
          onPause={
            handlePause
          }
          onTimeUpdate={
            handleTimeUpdate
          }
          onEnded={
            handleEnded
          }
        />

      </div>


      {/* =================================================
          CONTENT
      ================================================= */}

      <div className="watch-training-content">


        <div className="watch-main-content">

          <div className="watch-category">

            {
              training.category ||
              "General"
            }

          </div>


          <h1>
            {training.title}
          </h1>


          <p className="watch-description">

            {
              training.description ||
              "No description available."
            }

          </p>


          {/* =================================================
              TRAINING INFO
          ================================================= */}

          <div className="watch-training-info">


            <div>

              <span>
                Department
              </span>

              <strong>

                {
                  training
                    .department
                    ?.name ||
                  "-"
                }

              </strong>

            </div>


            <div>

              <span>
                Duration
              </span>

              <strong>

                {
                  formatDuration(
                    training.durationSeconds
                  )
                }

              </strong>

            </div>


            <div>

              <span>
                Uploaded By
              </span>

              <strong>

                {
                  training
                    .uploadedBy
                    ?.name ||
                  "-"
                }

              </strong>

            </div>


          </div>

        </div>


        {/* =================================================
            PROGRESS CARD
        ================================================= */}

        {isUser ? (

          <div className="watch-progress-card">


            <div className="watch-progress-header">

              <div>

                <span>
                  Your Progress
                </span>

                <strong>
                  {progressPercentage}%
                </strong>

              </div>


              {progress.completed && (

                <div className="watch-completed-icon">
                  ✓
                </div>

              )}

            </div>


            <div className="watch-progress-track">

              <div
                className={
                  progress.completed
                    ? "watch-progress-fill completed"
                    : "watch-progress-fill"
                }
                style={{
                  width:
                    `${progressPercentage}%`
                }}
              />

            </div>


            <div className="watch-progress-details">

              <span>

                Watched:{" "}

                {
                  formatDuration(
                    progress.watchedSeconds
                  )
                }

              </span>


              <span>

                Total:{" "}

                {
                  formatDuration(
                    training.durationSeconds
                  )
                }

              </span>

            </div>


            {!progress.completed ? (

              <button
                className="complete-training-button"
                onClick={markComplete}
                disabled={saving}
              >

                {saving
                  ? "Saving..."
                  : "✓ Mark as Complete"}

              </button>

            ) : (

              <div className="completed-training-message">

                ✓ You have completed this training.

              </div>

            )}

          </div>

        ) : (

          <div className="watch-progress-card">

            <div className="watch-progress-header">

              <div>

                <span>
                  Training Preview
                </span>

                <strong>
                  Admin / HOD
                </strong>

              </div>

            </div>


            <p style={{ marginTop: "15px" }}>

              You are viewing this training
              in preview mode. Employee
              progress is not recorded.

            </p>

          </div>

        )}

      </div>


      {/* =================================================
          SUCCESS MESSAGE
      ================================================= */}

      {message && (

        <div className="watch-success-message">

          {message}

        </div>

      )}

    </div>

  );

};


export default TrainingWatch;