import React, { useState, useEffect } from "react";
import {
  Scheduler,
  WeekView,
  DayView,
  MonthView,
  Appointments,
  Toolbar,
  DateNavigator,
  ViewSwitcher,
  AppointmentForm,
  AppointmentTooltip,
} from "@devexpress/dx-react-scheduler-material-ui";
import { Paper } from "@mui/material";
import {
  ViewState,
  EditingState,
  IntegratedEditing,
} from "@devexpress/dx-react-scheduler";
import { db } from "../firebase.js";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import css from "./Calendar.module.css";

const Calendar = () => {
  const [data, setData] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "events"), (snapshot) => {
      const events = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        startDate: doc.data().startDate.toDate(), // convert Date to Timestamp
        endDate: doc.data().endDate.toDate(), // convert Date to Timestamp
      }));
      setData(events);
    });

    return () => unsubscribe();
  }, []);

  const commitChanges = async ({ added, changed, deleted }) => {
    if (added) {
      const addedEvent = {
        ...added,
        startDate: Timestamp.fromDate(new Date(added.startDate)), // convert Date to Timestamp
        endDate: Timestamp.fromDate(new Date(added.endDate)), // convert Date do Timestamp
      };
      await addDoc(collection(db, "events"), addedEvent);
    }
    if (changed) {
      const eventId = Object.keys(changed)[0];
      const changedEvent = {
        ...changed[eventId],
        startDate: Timestamp.fromDate(new Date(changed[eventId].startDate)), // convert Date to Timestamp
        endDate: Timestamp.fromDate(new Date(changed[eventId].endDate)), // convert Date to Timestamp
      };
      const eventRef = doc(db, "events", eventId);
      await updateDoc(eventRef, changedEvent);
    }
    if (deleted !== undefined) {
      const eventRef = doc(db, "events", deleted);
      await deleteDoc(eventRef);
    }
  };

  return (
    <Paper className={css.calendarContainer}>
      <Scheduler data={data} locale="pl-PL">
        <ViewState
          currentDate={currentDate}
          onCurrentDateChange={setCurrentDate}
        />
        <EditingState onCommitChanges={commitChanges} />
        <IntegratedEditing />
        <DayView startDayHour={8} endDayHour={20} />
        <WeekView startDayHour={8} endDayHour={20} />
        <MonthView />
        <Appointments
          appointmentComponent={(props) => (
            <Appointments.Appointment
              {...props}
              className={css.customAppointment}
            />
          )}
        />
        <Toolbar
          rootComponent={(props) => (
            <Toolbar.Root {...props} className={css.customToolbar} />
          )}
        />
        <DateNavigator
          rootComponent={(props) => (
            <DateNavigator.Root
              {...props}
              className={css.customDateNavigator}
            />
          )}
        />
        <ViewSwitcher />
        <AppointmentTooltip
          showOpenButton
          showDeleteButton
          contentComponent={(props) => (
            <AppointmentTooltip.Content
              {...props}
              className={css.customAppointmentTooltip}
            />
          )}
        />
        <AppointmentForm />
      </Scheduler>
    </Paper>
  );
};

export default Calendar;
