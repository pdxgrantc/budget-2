import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import PropTypes from "prop-types";

// Firebase
import { auth, db } from "../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  doc,
  getDoc,
  collection,
  onSnapshot,
  where,
  orderBy,
  query,
} from "firebase/firestore";

// Chart.js
import { Line } from "react-chartjs-2";
import { Chart, registerables, CategoryScale } from "chart.js";

export default function Dashboard() {
  const [user] = useAuthState(auth);
  return (
    <>
      <Helmet>
        <title>Easy Budget - Dashboard</title>
      </Helmet>
      <div className="">
        <h2 className="text-subheader font-light">Welcome</h2>
        <h2 className="text-lheader font-semibold">{user.displayName}</h2>
      </div>
      <CurrentBalance />
      <div>
        <MonthlyEarning />
        <MonthlySpending />
      </div>
    </>
  );
}

function CurrentBalance() {
  const [user] = useAuthState(auth);
  const [currentBalance, setCurrentBalance] = useState(null);

  // pull user's current balance from firestore within the user document
  useEffect(() => {
    const fetchUserData = async () => {
      const userRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userRef);

      if (userDocSnap.exists()) {
        setCurrentBalance(userDocSnap.data().currentBalance);
      }
    };

    fetchUserData();
  }, [user]);

  return (
    <>
      {currentBalance !== null && (
        <div className="flex gap-2 text-xl">
          <h2>Your Current Balance:</h2>
          <h2>${currentBalance.toFixed(2)}</h2>
        </div>
      )}
    </>
  );
}

function MonthlyEarning() {
  const [user] = useAuthState(auth);
  const [monthlyEarnings, setMonthlyEarnings] = useState(null);

  useEffect(() => {
    // subscribe to the users income collection and pull the last 30 days of earnings and put them into an array by day
    const incomeRef = collection(db, "users", user.uid, "income");
    const q = query(
      incomeRef,
      orderBy("date", "desc"),
      where(
        "date",
        ">",
        new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      )
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map((doc) => doc.data());

      const sortedByDay = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const formattedDate = `${date.getDate()}-${date.getMonth() + 1}`; // JavaScript months are 0-indexed

        const docsForDate = docs.filter((doc) => {
          const docDate = doc.date.toDate();
          const docFormattedDate = `${docDate.getDate()}-${
            docDate.getMonth() + 1
          }`;
          return docFormattedDate === formattedDate;
        });

        const totalAmountForDate = docsForDate.reduce(
          (total, doc) => total + Number(doc.amount),
          0
        );

        return totalAmountForDate || 0;
      });

      setMonthlyEarnings(sortedByDay);
    });

    return () => {
      unsubscribe();
    };
  }, [user]);

  return (
    <>
      {monthlyEarnings !== null && (
        <div className="flex gap-2 text-xl">
          <h2>This month you have earned:</h2>
          <LineGraph inputData={monthlyEarnings} inputLabel="Earnings" />
        </div>
      )}
    </>
  );
}

function MonthlySpending() {
  const [user] = useAuthState(auth);
  const [monthlySpending, setMonthlySpending] = useState(null);

  useEffect(() => {
    // subscribe to the users income collection and pull the last 30 days of earnings and put them into an array by day
    const incomeRef = collection(db, "users", user.uid, "spending");
    const q = query(
      incomeRef,
      orderBy("date", "desc"),
      where(
        "date",
        ">",
        new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      )
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map((doc) => doc.data());

      const sortedByDay = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const formattedDate = `${date.getDate()}-${date.getMonth() + 1}`; // JavaScript months are 0-indexed

        const docsForDate = docs.filter((doc) => {
          const docDate = doc.date.toDate();
          const docFormattedDate = `${docDate.getDate()}-${
            docDate.getMonth() + 1
          }`;
          return docFormattedDate === formattedDate;
        });

        const totalAmountForDate = docsForDate.reduce(
          (total, doc) => total + Number(doc.amount),
          0
        );

        return totalAmountForDate || 0;
      });

      setMonthlySpending(sortedByDay);
    });

    return () => {
      unsubscribe();
    };
  }, [user]);

  return (
    <>
      {monthlySpending !== null && (
        <div className="flex gap-2 text-xl">
          <h2>This month you have spent:</h2>
          <LineGraph inputData={monthlySpending} inputLabel="Spending" />
        </div>
      )}
    </>
  );
}

Chart.register(...registerables);

Chart.register(CategoryScale);

function LineGraph({
  inputData,
  inputLabel,
  inputBackgroundColor,
  inputBorderColor,
}) {
  const [input, setInput] = useState([]);
  const [label, setLabel] = useState("");
  const [backgroundColor, setBackgroundColor] = useState(
    "rgba(75,192,192,0.5)"
  );
  const [borderColor, setBorderColor] = useState("rgba(75,192,192,1)");

  useEffect(() => {
    setInput(inputData);
  }, [inputData]);

  useEffect(() => {
    if (inputLabel) {
      setLabel(inputLabel);
    } else {
      setLabel("");
    }
  }, [inputLabel]);

  useEffect(() => {
    if (inputBackgroundColor) {
      setBackgroundColor(inputBackgroundColor);
    } else {
      setBackgroundColor("rgba(75,192,192,0.5)");
    }
  }, [inputBackgroundColor]);

  useEffect(() => {
    if (inputBorderColor) {
      setBorderColor(inputBorderColor);
    } else {
      setBorderColor("rgba(75,192,192,1)");
    }
  }, [inputBorderColor]);

  const options = {
    title: {
      display: false,
      text: "Earnings",
      font: {
        size: 25,
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Date",
          color: "#d6d6d6", // Change the x-axis title text color here
          font: {
            size: 18, // Change the x-axis title font size here
          },
        },
        grid: {
          color: "#383838", // Change the color of the x-axis lines here
        },
        ticks: {
          color: "#d6d6d6", // Change the x-axis label text color here
          font: {
            size: 14, // Change the x-axis label font size here
          },
        },
      },
      y: {
        title: {
          display: true,
          text: "Amount",
          color: "#d6d6d6", // Change the y-axis title text color here
          font: {
            size: 18, // Change the y-axis title font size here
          },
        },
        grid: {
          color: "#383838", // Change the color of the x-axis lines here
        },
        ticks: {
          color: "#d6d6d6", // Change the y-axis label text color here
          font: {
            size: 18, // Change the y-axis label font size here
          },
        },
      },
    },
    plugins: {
      legend: {
        display: false,
        labels: {
          color: "#d6d6d6", // Change the label text color here
          font: {
            size: 18, // Change the label font size here
          },
        },
      },
    },
  };

  const labels = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return `${date.toLocaleString("default", {
      month: "short",
    })} ${date.getDate()}`;
  });

  const data = {
    labels: labels,
    datasets: [
      {
        label: label,
        data: input,
        fill: true,
        backgroundColor: backgroundColor,
        borderColor: borderColor,
      },
    ],
  };

  return (
    <div className="w-full h-auto">
      <Line data={data} options={options} />
    </div>
  );
}

LineGraph.propTypes = {
  inputData: PropTypes.array.isRequired,
  inputLabel: PropTypes.string,
  inputBackgroundColor: PropTypes.string,
  inputBorderColor: PropTypes.string,
};
