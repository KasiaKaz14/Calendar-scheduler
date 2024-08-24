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
    // Subscribe to Firestore collection
    const unsubscribe = onSnapshot(collection(db, "events"), (snapshot) => {
      const events = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          startDate: data.startDate ? data.startDate.toDate() : new Date(), // Handle null values
          endDate: data.endDate ? data.endDate.toDate() : new Date(), // Handle null values
        };
      });
      setData(events);
    });

    return () => unsubscribe(); // Cleanup subscription on unmount
  }, []);

  const commitChanges = async ({ added, changed, deleted }) => {
    try {
      if (added) {
        const addedEvent = {
          ...added,
          startDate: added.startDate
            ? Timestamp.fromDate(new Date(added.startDate))
            : null,
          endDate: added.endDate
            ? Timestamp.fromDate(new Date(added.endDate))
            : null,
        };
        await addDoc(collection(db, "events"), addedEvent);
      }

      if (changed) {
        const eventId = Object.keys(changed)[0];
        const changedEvent = {
          ...data.find((event) => event.id === eventId), // Preserve existing data
          ...changed[eventId], // Apply changes
          startDate: changed[eventId].startDate
            ? Timestamp.fromDate(new Date(changed[eventId].startDate))
            : data.find((event) => event.id === eventId).startDate, // Preserve existing date if not changed
          endDate: changed[eventId].endDate
            ? Timestamp.fromDate(new Date(changed[eventId].endDate))
            : data.find((event) => event.id === eventId).endDate, // Preserve existing date if not changed
        };
        const eventRef = doc(db, "events", eventId);
        await updateDoc(eventRef, changedEvent);
      }

      if (deleted !== undefined) {
        const eventRef = doc(db, "events", deleted);
        await deleteDoc(eventRef);
      }
    } catch (error) {
      console.error("Error handling document: ", error);
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
