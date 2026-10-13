import {
  NavLink,
  Outlet
} from "react-router-dom";

import {
  useAuth
} from "../context/AuthContext";

import Footer from "./Footer"; 


const Layout = () => {

  const {
    user,
    logout
  } = useAuth();


  // =================================================
  // MENU ITEMS
  // =================================================

  const getMenuItems = () => {

    // =================================================
    // ADMIN
    // =================================================

    if (
      user?.role === "ADMIN"
    ) {

      return [

        {
          label: "Dashboard",
          path: "/dashboard",
          icon: "📊"
        },

        {
          label: "Departments",
          path: "/departments",
          icon: "🏢"
        },

        {
          label: "Users",
          path: "/users",
          icon: "👥"
        },

        {
          label: "All Trainings",
          path: "/trainings",
          icon: "🎥"
        },

        {
          label: "Upload Training",
          path: "/upload-training",
          icon: "⬆️"
        },

        {
          label: "Manage Trainings",
          path: "/manage-trainings",
          icon: "📝"
        },

        {
          label: "Reports",
          path: "/reports",
          icon: "📈"
        }

      ];

    }


    // =================================================
    // HOD
    // =================================================

    if (
      user?.role === "HOD"
    ) {

      return [

        {
          label: "Dashboard",
          path: "/dashboard",
          icon: "📊"
        },

        {
          label: "My Department",
          path: "/department",
          icon: "🏢"
        },

        {
          label: "Training Videos",
          path: "/trainings",
          icon: "🎥"
        },

        {
          label: "Upload Training",
          path: "/upload-training",
          icon: "⬆️"
        },

        {
          label: "Manage Trainings",
          path: "/manage-trainings",
          icon: "📝"
        },

        {
          label: "Reports",
          path: "/reports",
          icon: "📈"
        }

      ];

    }


    // =================================================
    // USER
    // =================================================

    return [

      {
        label: "Dashboard",
        path: "/dashboard",
        icon: "📊"
      },

      {
        label: "My Department",
        path: "/department",
        icon: "🏢"
      },

      {
        label: "Training Videos",
        path: "/trainings",
        icon: "🎥"
      },

      {
        label: "My Progress",
        path: "/progress",
        icon: "📚"
      },

      {
        label: "Completed Training",
        path: "/completed",
        icon: "✅"
      }

    ];
  };


  const menuItems =
    getMenuItems();


  // =================================================
  // RENDER
  // =================================================

  return (

    <div className="app-layout">

      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside className="sidebar">

        {/* LOGO */}

        <div className="sidebar-logo">

          <div className="sidebar-logo-icon">
            LP
          </div>

          <div>

            <h2>
              Learning Portal
            </h2>

            <span>
              Hospital Training
            </span>

          </div>

        </div>


        {/* SECTION */}

        <div className="sidebar-section-title">
          MAIN MENU
        </div>


        {/* MENU */}

        <nav className="sidebar-menu">

          {menuItems.map(
            item => (

              <NavLink
                key={
                  item.path
                }
                to={
                  item.path
                }
                className={({
                  isActive
                }) =>
                  `sidebar-link ${
                    isActive
                      ? "active"
                      : ""
                  }`
                }
              >

                <span className="sidebar-icon">
                  {item.icon}
                </span>

                <span>
                  {item.label}
                </span>

              </NavLink>

            )
          )}

        </nav>


        {/* =================================================
            BOTTOM
        ================================================= */}

        <div className="sidebar-bottom">

          <div className="user-mini-card">

            <div className="user-avatar">

              {user?.name
                ?.charAt(0)
                ?.toUpperCase()}

            </div>


            <div className="user-mini-info">

              <strong>
                {user?.name}
              </strong>

              <span>
                {user?.role}
              </span>

            </div>

          </div>


          <button
            className="logout-button"
            onClick={logout}
          >
            🚪 Logout
          </button>

        </div>

      </aside>


      {/* =================================================
          MAIN AREA
      ================================================= */}

      <main className="main-area">

        <header className="top-header">

          <div>

            <h1>
              Hospital Learning Portal
            </h1>

            <p>
              Training & Employee Development
            </p>

          </div>


          <div className="header-user">

            <div className="header-user-avatar">

              {user?.name
                ?.charAt(0)
                ?.toUpperCase()}

            </div>


            <div>

              <strong>
                {user?.name}
              </strong>

              <span>
                {
                  user?.department?.name ||
                  "All Departments"
                }
              </span>

            </div>

          </div>

        </header>


        <section className="page-content">

          <Outlet />

        </section>

        <Footer />

      </main>

    </div>
  );
};


export default Layout;